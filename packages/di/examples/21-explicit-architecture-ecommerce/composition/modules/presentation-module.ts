/** The presentation module — binds the HTTP server, controllers, and CLI, all decorator-wired. */

import { Module } from "@codefast/di";

import {
  PlaceOrderCommandCli,
  PlaceOrderCommandCliToken,
} from "#/examples/21-explicit-architecture-ecommerce/presentation/cli/place-order-command";
import {
  CatalogController,
  CatalogControllerToken,
} from "#/examples/21-explicit-architecture-ecommerce/presentation/http/routes/catalog-routes";
import {
  CheckoutController,
  CheckoutControllerToken,
} from "#/examples/21-explicit-architecture-ecommerce/presentation/http/routes/checkout-routes";
import { HttpServer, HttpServerToken } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/server";

/** Binds the driving adapters — one HTTP server, two controllers, and a CLI over the same use cases. */
export const presentationModule = Module.create("Presentation", (builder) => {
  builder.bind(HttpServerToken).to(HttpServer).singleton();
  builder.bind(CatalogControllerToken).to(CatalogController).singleton();
  builder.bind(CheckoutControllerToken).to(CheckoutController).singleton();
  builder.bind(PlaceOrderCommandCliToken).to(PlaceOrderCommandCli).singleton();
});
