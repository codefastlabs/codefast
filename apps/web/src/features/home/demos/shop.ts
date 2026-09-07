/** The demo container the home page wires live: a small order flow with every scope the library offers. */
import { Container, injectable, token } from "@codefast/di";
import type { ContainerGraphJson } from "@codefast/di";

/** Configuration the catalog reads; bound as a constant. */
export interface ShopConfig {
  readonly currency: string;
}

/** A price in the shop's currency. */
export interface Price {
  readonly amount: number;
  readonly currency: string;
}

/** Charges an order; bound through a transient factory, so every resolve gets a fresh gateway. */
export interface PaymentGateway {
  readonly instance: number;
  charge(price: Price): string;
}

// Every service is bound through a named token: a class's own name does not survive the client bundle's minifier.
export const ShopConfigToken = token<ShopConfig>("shop:ShopConfig");
export const PaymentGatewayToken = token<PaymentGateway>("shop:PaymentGateway");
export const LoggerToken = token<Logger>("shop:Logger");
export const PriceCatalogToken = token<PriceCatalog>("shop:PriceCatalog");
export const InventoryToken = token<Inventory>("shop:Inventory");
export const RequestContextToken = token<RequestContext>("shop:RequestContext");
export const OrderServiceToken = token<OrderService>("shop:OrderService");

// Numbers every constructed instance, so the log can show which ones the container reused.
let sequence = 0;

function nextInstance(): number {
  sequence += 1;

  return sequence;
}

/** Records what the services log, so the playground can show it. */
@injectable()
export class Logger {
  readonly instance = nextInstance();
  readonly lines: Array<string> = [];

  info(message: string): void {
    this.lines.push(message);
  }
}

@injectable([ShopConfigToken])
export class PriceCatalog {
  readonly instance = nextInstance();

  constructor(private readonly config: ShopConfig) {}

  priceOf(sku: string): Price {
    return { amount: sku.length * 7, currency: this.config.currency };
  }
}

@injectable([LoggerToken])
export class Inventory {
  readonly instance = nextInstance();

  constructor(private readonly logger: Logger) {}

  reserve(sku: string): void {
    this.logger.info(`Inventory#${this.instance} reserved ${sku}`);
  }
}

/** One per request scope: a child container gives every order its own context. */
@injectable()
export class RequestContext {
  readonly instance = nextInstance();
  readonly requestId = `req-${this.instance}`;
}

@injectable([PriceCatalogToken, InventoryToken, RequestContextToken, PaymentGatewayToken, LoggerToken])
export class OrderService {
  readonly instance = nextInstance();

  constructor(
    readonly catalog: PriceCatalog,
    readonly inventory: Inventory,
    readonly context: RequestContext,
    readonly payments: PaymentGateway,
    readonly logger: Logger,
  ) {}

  place(sku: string): string {
    this.inventory.reserve(sku);

    const receipt = this.payments.charge(this.catalog.priceOf(sku));

    this.logger.info(`${this.context.requestId}: ${sku} → ${receipt}`);

    return receipt;
  }
}

/** A fresh gateway per resolve, numbered like every other instance so the log can tell them apart. */
function createGateway(): PaymentGateway {
  const instance = nextInstance();

  return { instance, charge: (price) => `pay-${instance} for ${price.amount.toFixed(2)} ${price.currency}` };
}

/** The demo container and the graph the library derives from its bindings. */
export interface Shop {
  readonly container: Container;
  readonly graph: ContainerGraphJson;
}

/** How OrderService is bound: transient as the live graph ships it, or the singleton validate() refuses. */
export interface ShopOptions {
  readonly orderService?: "transient" | "singleton" | undefined;
}

/** Binds the order flow by token: three singletons, a constant, a transient factory, a scoped context, and the root. */
export function createShop(options: ShopOptions = {}): Shop {
  const container = Container.create();

  container.bind(ShopConfigToken).toConstantValue({ currency: "USD" });
  container.bind(LoggerToken).to(Logger).singleton();
  container.bind(PriceCatalogToken).to(PriceCatalog).singleton();
  container.bind(InventoryToken).to(Inventory).singleton();
  container.bind(PaymentGatewayToken).toDynamic(createGateway).transient();
  container.bind(RequestContextToken).to(RequestContext).scoped();

  const orderService = container.bind(OrderServiceToken).to(OrderService);

  if (options.orderService === "singleton") {
    orderService.singleton();
  } else {
    orderService.transient();
  }

  return { container, graph: container.generateDependencyGraph() };
}
