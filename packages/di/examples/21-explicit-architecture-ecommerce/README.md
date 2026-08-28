# Example 21 — Explicit Architecture (E-commerce)

Explicit Architecture at a larger scale: several bounded contexts (catalog, order, payment), two transports over one use
case (HTTP + CLI), config-selected adapters, multi-provider payments, and multi-channel notifications. Like
[Example 20](../20-explicit-architecture) it wires with `@injectable` / `inject` decorators and keeps the **domain**
framework-free; unlike 20 it spreads the pattern across a full application.

|                | Example 20                    | Example 21 (this one)                                     |
| -------------- | ----------------------------- | --------------------------------------------------------- |
| Scope          | one bounded context (banking) | catalog + order + payment                                 |
| Transports     | a single controller           | HTTP routes **and** a CLI, one use case                   |
| Adapter choice | fixed                         | selected at runtime from `AppConfig`                      |
| Multi-binding  | event handlers                | payment providers + notification channels                 |
| Wiring         | `@injectable` + `.to()`       | same, plus factories where a runtime decision is involved |

```sh
npx tsx examples/21-explicit-architecture-ecommerce/21-explicit-architecture-ecommerce.ts
```

## The dependency rule

Dependencies point **inward**. Decorated classes name `@codefast/di`, but the **domain** never does — entities, value
objects, and invariants are plain TypeScript. Prove it:

```sh
grep -rl "@codefast/di" domain   # → no matches
```

## Layout

```text
21-explicit-architecture-ecommerce/
├── domain/                     # pure business — the only ring free of @codefast/di
│   ├── catalog/                #   Product entity + ids + errors
│   ├── order/                  #   Order aggregate + status
│   ├── payment/                #   PaymentIntent value object
│   └── shared/                 #   Money, DomainEvent, DomainError base
├── application/                # @injectable use cases + the ports (interface + token) they depend on
│   ├── ports/                  #   each port: an interface AND its token
│   ├── catalog/                #   GetProduct, ListProducts
│   ├── checkout/               #   PlaceOrder (orchestration) + its DTOs
│   └── shared/                 #   application errors
├── infrastructure/             # driven adapters — implement the ports
│   ├── persistence/            #   in-memory (demo) + postgres (prod) + a mock pool
│   ├── payment/                #   Stripe + PayPal gateways
│   ├── notification/           #   email + SMS senders
│   ├── system/                 #   clock + id generator
│   └── config/                 #   env config
├── presentation/               # driving adapters
│   ├── http/                   #   a mock server, route controllers, request context
│   └── cli/                    #   a CLI command over the same use case
├── composition/                # the composition root
│   ├── modules/                #   one module per layer + a root app module
│   ├── container.ts            #   fromModules + validate
│   └── bootstrap.ts            #   the runnable scenario
└── 21-explicit-architecture-ecommerce.ts   # thin entry the runner invokes → bootstrap()
```

Each port co-locates its token with its interface (`application/ports/*`), so a decorated class can ask for what it
needs by token without reaching into the composition root.

## How the wiring works

A decorator records what a constructor needs, and the module binds the class with a one-liner:

```ts
@injectable([inject(ProductRepositoryToken)])
export class GetProduct {
  constructor(private readonly products: ProductRepository) {}
}

// application-module.ts
builder.bind(GetProductToken).to(GetProduct).singleton();
```

`PlaceOrder` needs every gateway and every channel, so its decorator uses `injectAll`:

```ts
@injectable([
  inject(ProductRepositoryToken),
  inject(OrderRepositoryToken),
  injectAll(PaymentGatewayToken),
  injectAll(NotificationSenderToken),
  inject(ClockToken),
  inject(IdGeneratorToken),
  inject(UnitOfWorkToken),
])
export class PlaceOrder {
  /* … */
}
```

The **smart part**: config is a compose-time value, so the module reads it once and lets the container construct and
wire the chosen adapter with `.to()` — no manual `new` in a runtime factory, and `validate()` still traces the graph:

```ts
const config = loadEnvConfig();

// inside the module:
if (config.database === "postgres") {
  builder.bind(PgPoolToken).toConstantValue(new PgPool(config.postgresUrl));
  builder.bind(ProductRepositoryToken).to(PostgresProductRepository).singleton();
} else {
  builder.bind(ProductRepositoryToken).to(InMemoryProductRepository).singleton();
}
```

## Which `@codefast/di` feature plays which architectural role

| Architectural concept                   | `@codefast/di` mechanism                           |
| --------------------------------------- | -------------------------------------------------- |
| Port (interface + identity)             | an interface plus a `token<Interface>()` beside it |
| Adapter with no/service deps            | an `@injectable` class bound with `.to()`          |
| Declaring a class's dependencies        | `@injectable([inject(Token), …])`                  |
| Injecting every binding of a port       | `injectAll(Token)` in the decorator                |
| Choosing an adapter by config           | a compose-time `if` + `.to()` (config read once)   |
| Many providers/channels behind one port | `whenNamed` slots + `injectAll` / `resolveAll`     |
| Bounded module per layer                | `Module.create` + a root `builder.import`          |
| One correlation id per request          | a `scoped()` binding + `createChild()`             |
| Wire-up check before serving traffic    | `container.validate()`                             |
| Seeing the dependency rule              | `generateDependencyGraph()` + `toDotGraph()`       |

## What the run shows

The bootstrap seeds a catalog, wires the HTTP routes, then drives the same `PlaceOrder` use case through two different
driving adapters — an HTTP `POST /checkout` and a CLI command — proving the use case is transport-agnostic. It selects a
payment gateway by currency, fans a confirmation out to every notification channel, refuses an oversell at the domain
boundary (mapped to `422`), and resolves a fresh request-scoped correlation id per child container.

## Is this too many files?

Yes — deliberately. This is the scale at which Explicit Architecture earns its keep: several bounded contexts, multiple
adapters per port, and two transports over one use case. For a smaller service the ceremony would cost more than it
returns — see [`packages/cli/DECISIONS.md`](../../../cli/DECISIONS.md) for a worked account of that mistake. Reach for
this shape when the domain earns it.
