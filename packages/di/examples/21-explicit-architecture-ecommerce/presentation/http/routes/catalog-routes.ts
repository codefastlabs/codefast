/** The catalog HTTP routes — a driving adapter that turns requests into catalog use-case calls. */

import { inject, injectable, token } from "@codefast/di";

import type { GetProduct } from "#/examples/21-explicit-architecture-ecommerce/application/catalog/get-product";
import { GetProductToken } from "#/examples/21-explicit-architecture-ecommerce/application/catalog/get-product";
import type { ListProducts } from "#/examples/21-explicit-architecture-ecommerce/application/catalog/list-products";
import { ListProductsToken } from "#/examples/21-explicit-architecture-ecommerce/application/catalog/list-products";
import type { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";
import type { HttpServer } from "#/examples/21-explicit-architecture-ecommerce/presentation/http/server";

/** A JSON-safe view of a product, decoupled from the domain entity. */
function toProductView(product: Product): Record<string, unknown> {
  return { id: product.id, name: product.name, price: product.unitPrice.toString(), stock: product.stock };
}

/** Binds `GET /products` and `GET /products/:id` to the catalog use cases. */
@injectable([inject(GetProductToken), inject(ListProductsToken)])
export class CatalogController {
  constructor(
    private readonly getProduct: GetProduct,
    private readonly listProducts: ListProducts,
  ) {}

  /** Registers this controller's routes on `server`. */
  register(server: HttpServer): void {
    server.route("GET", "/products", async () => {
      const products = await this.listProducts.execute();

      return { status: 200, body: products.map(toProductView) };
    });

    server.route("GET", "/products/:id", async (request) => {
      const product = await this.getProduct.execute(request.params.id ?? "");

      return { status: 200, body: toProductView(product) };
    });
  }
}

/** Injection token for the catalog controller. */
export const CatalogControllerToken = token<CatalogController>("CatalogController");
