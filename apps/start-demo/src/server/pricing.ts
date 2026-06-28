import { Container, token } from "@codefast/di";
import { createServerFn } from "@tanstack/react-start";

/* ---------------------------------------------------------------------------
 * Domain model
 * ------------------------------------------------------------------------ */

interface Plan {
  sku: string;
  name: string;
  net: number;
}

interface PricedPlan extends Plan {
  tax: number;
  gross: number;
}

interface TaxConfig {
  region: string;
  rate: number;
}

interface Clock {
  now: () => string;
}

interface PlanRepository {
  list: () => Array<Plan>;
}

interface PricingPolicy {
  price: (plan: Plan) => PricedPlan;
}

interface CatalogService {
  pricedCatalog: () => PricedCatalog;
}

export interface PricedCatalog {
  region: string;
  currency: string;
  generatedAt: string;
  plans: Array<PricedPlan>;
}

/* ---------------------------------------------------------------------------
 * Tokens — typed keys pairing a name with a TypeScript type. They compare by
 * reference, so each is declared once as a module-level const.
 * ------------------------------------------------------------------------ */

const TaxConfigToken = token<TaxConfig>("TaxConfig");
const ClockToken = token<Clock>("Clock");
const PlanRepositoryToken = token<PlanRepository>("PlanRepository");
const PricingPolicyToken = token<PricingPolicy>("PricingPolicy");
const CatalogServiceToken = token<CatalogService>("CatalogService");

/* ---------------------------------------------------------------------------
 * Composition root — wire the whole object graph once, on the server.
 * ------------------------------------------------------------------------ */

function createServerContainer(): Container {
  const container = Container.create();

  // Constant binding: configuration a real app would load from env / a config service.
  container.bind(TaxConfigToken).toConstantValue({ region: "EU", rate: 0.2 });

  // Factory bindings. `singleton()` means the container builds each value once and caches it.
  container
    .bind(ClockToken)
    .toDynamic(() => ({ now: () => new Date().toISOString() }))
    .singleton();

  container
    .bind(PlanRepositoryToken)
    .toDynamic(() => ({
      list: (): Array<Plan> => [
        { sku: "starter", name: "Starter", net: 0 },
        { sku: "team", name: "Team", net: 49 },
        { sku: "enterprise", name: "Enterprise", net: 199 },
      ],
    }))
    .singleton();

  // A factory resolves its own dependencies through the resolution context — the pricing
  // policy depends on the tax config without ever knowing how that config was built.
  container
    .bind(PricingPolicyToken)
    .toDynamic((context) => {
      const config = context.resolve(TaxConfigToken);

      return {
        price: (plan: Plan): PricedPlan => {
          const tax = Math.round(plan.net * config.rate * 100) / 100;

          return { ...plan, tax, gross: plan.net + tax };
        },
      };
    })
    .singleton();

  // The service composes the repository, policy, and clock — all injected, none constructed
  // by hand. Swapping any binding (e.g. `container.rebind(...)` in a test) re-wires the whole
  // graph with zero changes to this service.
  container
    .bind(CatalogServiceToken)
    .toDynamic((context) => {
      const repository = context.resolve(PlanRepositoryToken);
      const policy = context.resolve(PricingPolicyToken);
      const clock = context.resolve(ClockToken);
      const config = context.resolve(TaxConfigToken);

      return {
        pricedCatalog: (): PricedCatalog => ({
          region: config.region,
          currency: "USD",
          generatedAt: clock.now(),
          plans: repository.list().map((plan) => policy.price(plan)),
        }),
      };
    })
    .singleton();

  return container;
}

// Built lazily and referenced only inside the server function below, so neither the container
// nor `@codefast/di` is ever pulled into the client bundle.
let container: Container | undefined;

function getContainer(): Container {
  container ??= createServerContainer();

  return container;
}

/* ---------------------------------------------------------------------------
 * Server function — the fullstack boundary. Runs only on the server; the client calls it as
 * an RPC. The typed token guarantees the return type all the way to the loader.
 * ------------------------------------------------------------------------ */

export const getPricedCatalogServerFn = createServerFn({ method: "GET" }).handler((): PricedCatalog => {
  return getContainer().resolve(CatalogServiceToken).pricedCatalog();
});
