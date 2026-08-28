/** The runnable entry — seeds the catalog, drives the app over HTTP and CLI, and shows the dependency graph. */

import { toDotGraph } from "@codefast/di";

import { ProductRepositoryToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import { createContainer } from "#/examples/21-explicit-architecture-ecommerce/composition/container";
import { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";
import { toProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";
import { Money } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/money";
import { PlaceOrderCommandCliToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/cli/place-order-command";
import { RequestContextToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/middleware/request-context";
import { CatalogControllerToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/routes/catalog-routes";
import { CheckoutControllerToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/routes/checkout-routes";
import { HttpServerToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/server";
import { banner, item, ok, section, step } from "#/examples/support/log";

/** Boots the container and walks a full checkout through every driving adapter. */
export async function bootstrap(): Promise<void> {
  banner("Example 21 — Explicit Architecture (E-commerce)");

  section("Composition root — validate the wiring");
  const container = createContainer();
  ok("container.validate() passed — every port has a compatible adapter");

  section("Seed the catalog through the repository port");
  const products = container.resolve(ProductRepositoryToken);
  await products.save(Product.list(toProductId("p_keyboard"), "Mechanical Keyboard", Money.of(89, "USD"), 5));
  await products.save(Product.list(toProductId("p_mouse"), "Wireless Mouse", Money.of(45, "USD"), 8));
  step("2 products seeded");

  section("Wire HTTP routes onto the server");
  const server = container.resolve(HttpServerToken);
  container.resolve(CatalogControllerToken).register(server);
  container.resolve(CheckoutControllerToken).register(server);
  ok("catalog + checkout routes registered");

  section("Drive the app over HTTP");
  const list = await server.handle("GET", "/products");
  item("GET /products → status", list.status);
  item("GET /products/p_keyboard → body", (await server.handle("GET", "/products/p_keyboard")).body);
  const checkout = await server.handle("POST", "/checkout", {
    customerEmail: "alice@example.com",
    currency: "USD",
    items: [{ productId: "p_keyboard", quantity: 2 }],
  });
  item("POST /checkout → status", checkout.status);
  item("POST /checkout → body", checkout.body);

  section("Domain invariant — overselling is refused, mapped to 422");
  const oversell = await server.handle("POST", "/checkout", {
    customerEmail: "alice@example.com",
    currency: "USD",
    items: [{ productId: "p_mouse", quantity: 999 }],
  });
  item("oversell → status", oversell.status);
  item("oversell → body", oversell.body);

  section("Same use case, a different driving adapter — CLI");
  await container
    .resolve(PlaceOrderCommandCliToken)
    .run("bob@example.com", "EUR", [{ productId: "p_mouse", quantity: 1 }]);

  section("Per-request scope — one correlation id per request");
  const request1 = container.createChild();
  const request2 = container.createChild();
  item("request 1", request1.resolve(RequestContextToken).correlationId);
  item("request 2", request2.resolve(RequestContextToken).correlationId);

  section("The dependency rule, made visible");
  step("Decorated classes import @codefast/di, but the domain ring never does. Prove it:");
  step('grep -rl "@codefast/di" domain   # → no matches');
  step("Dependency graph as Graphviz DOT:");
  console.log(toDotGraph(container.generateDependencyGraph()));
}
