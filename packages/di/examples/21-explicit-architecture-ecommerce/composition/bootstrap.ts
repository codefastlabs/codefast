/** The runnable entry — NeonCart's Black Friday drop, driven over HTTP and the warehouse CLI. */

import { toDotGraph } from "@codefast/di";

import { PaymentGatewayToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/payment-gateway";
import type { PaymentGateway } from "#/examples/21-explicit-architecture-ecommerce/application/ports/payment-gateway";
import { ProductRepositoryToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import { createContainer } from "#/examples/21-explicit-architecture-ecommerce/composition/container";
import { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";
import { toProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";
import type { OrderId } from "#/examples/21-explicit-architecture-ecommerce/domain/order/order-id";
import type { PaymentIntent } from "#/examples/21-explicit-architecture-ecommerce/domain/payment/payment-intent";
import { Money } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/money";
import { PlaceOrderCommandCliToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/cli/place-order-command";
import { RequestContextToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/middleware/request-context";
import { CatalogControllerToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/routes/catalog-routes";
import { CheckoutControllerToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/routes/checkout-routes";
import { HttpServerToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/server";
import { banner, item, ok, section, step } from "#/examples/support/log";

// ── Test doubles ─────────────────────────────────────────────────────────────────────────────────────────────────────

/** A `PaymentGateway` whose acquirer declines every charge, swapped in through the port to replay an outage. */
class DecliningPaymentGateway implements PaymentGateway {
  readonly name = "declining-acquirer";

  supports(_currency: string): boolean {
    return true;
  }

  async charge(orderId: OrderId, amount: Money): Promise<PaymentIntent> {
    console.log(`    [declining-acquirer] refused ${amount.toString()} for ${orderId}`);

    return { id: `decline_${orderId}`, orderId, amount, gateway: this.name, status: "failed" };
  }
}

/** Boots the container and races a limited-stock drop through both driving adapters. */
export async function bootstrap(): Promise<void> {
  banner("Example 21 — NeonCart: Black Friday, the 47-second window");

  section("Composition root — validate the wiring");
  const container = createContainer();
  ok("container.validate() passed — every port has a compatible adapter");

  section("Seed the drop — only 3 pairs of Void Runner X exist worldwide");
  const products = container.resolve(ProductRepositoryToken);
  await products.save(Product.list(toProductId("void_runner_x"), "Void Runner X", Money.of(2400, "USD"), 3));
  await products.save(Product.list(toProductId("prism_hoodie"), "Prism Hoodie", Money.of(120, "USD"), 50));
  step("catalog seeded — Void Runner X stock: 3");

  section("Wire HTTP routes onto the server");
  const server = container.resolve(HttpServerToken);
  container.resolve(CatalogControllerToken).register(server);
  container.resolve(CheckoutControllerToken).register(server);
  ok("catalog + checkout routes registered");

  section("Browse the drop over HTTP");
  item("GET /products → status", (await server.handle("GET", "/products")).status);
  item("GET /products/void_runner_x → body", (await server.handle("GET", "/products/void_runner_x")).body);

  section("Shopper A buys 1 over HTTP — success fans out to email + SMS + Discord");
  const first = await server.handle("POST", "/checkout", {
    customerEmail: "aria@shopper.example",
    currency: "USD",
    items: [{ productId: "void_runner_x", quantity: 1 }],
  });
  item("POST /checkout → status", first.status);
  item("POST /checkout → body", first.body);

  section("Warehouse holds the last 2 for a VIP — the SAME use case, over the CLI");
  await container
    .resolve(PlaceOrderCommandCliToken)
    .run("vip-desk@neoncart.internal", "USD", [{ productId: "void_runner_x", quantity: 2 }]);
  step("Void Runner X stock is now 0");

  section("Shopper B is 47 seconds too late — the DOMAIN refuses the oversell, mapped to 422");
  const late = await server.handle("POST", "/checkout", {
    customerEmail: "ben@shopper.example",
    currency: "USD",
    items: [{ productId: "void_runner_x", quantity: 1 }],
  });
  item("POST /checkout → status", late.status);
  item("POST /checkout → body", late.body);

  section("A yen order no configured gateway can settle — UNSUPPORTED_CURRENCY, mapped to 422");
  const unsupported = await server.handle("POST", "/checkout", {
    customerEmail: "yuki@shopper.example",
    currency: "JPY",
    items: [{ productId: "prism_hoodie", quantity: 1 }],
  });
  item("POST /checkout → status", unsupported.status);
  item("POST /checkout → body", unsupported.body);

  section("Incident replay — the acquirer starts declining; rebind swaps the gateway, nothing else moves");
  const replay = createContainer();
  await replay
    .resolve(ProductRepositoryToken)
    .save(Product.list(toProductId("prism_hoodie"), "Prism Hoodie", Money.of(120, "USD"), 50));
  replay.rebind(PaymentGatewayToken).toConstantValue(new DecliningPaymentGateway());
  const replayServer = replay.resolve(HttpServerToken);
  replay.resolve(CheckoutControllerToken).register(replayServer);
  const declined = await replayServer.handle("POST", "/checkout", {
    customerEmail: "aria@shopper.example",
    currency: "USD",
    items: [{ productId: "prism_hoodie", quantity: 1 }],
  });
  item("POST /checkout → status", declined.status);
  item("POST /checkout → body", declined.body);

  section("Who took the last pair? — one correlation id per request, for the audit trail");
  const requestA = container.createChild();
  const requestB = container.createChild();
  item("shopper A's request", requestA.resolve(RequestContextToken).correlationId);
  item("shopper B's request", requestB.resolve(RequestContextToken).correlationId);

  section("The dependency rule, made visible");
  step("Decorated classes import @codefast/di, but the domain ring never does. Prove it:");
  step('grep -rl "@codefast/di" domain   # → no matches');
  step("Dependency graph as Graphviz DOT:");
  console.log(toDotGraph(container.generateDependencyGraph()));
}
