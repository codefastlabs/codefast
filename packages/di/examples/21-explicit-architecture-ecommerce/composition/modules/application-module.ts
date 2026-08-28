/** The application module — binds each use case; the decorators declare their own dependencies. */

import { Module } from "@codefast/di";

import {
  GetProduct,
  GetProductToken,
} from "#/examples/21-explicit-architecture-ecommerce/application/catalog/get-product";
import {
  ListProducts,
  ListProductsToken,
} from "#/examples/21-explicit-architecture-ecommerce/application/catalog/list-products";
import {
  PlaceOrder,
  PlaceOrderToken,
} from "#/examples/21-explicit-architecture-ecommerce/application/checkout/place-order";

/** Binds the use cases; each `@injectable` class carries its own `inject`/`injectAll` deps. */
export const applicationModule = Module.create("Application", (builder) => {
  builder.bind(GetProductToken).to(GetProduct).singleton();
  builder.bind(ListProductsToken).to(ListProducts).singleton();
  builder.bind(PlaceOrderToken).to(PlaceOrder).singleton();
});
