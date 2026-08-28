/** The `ListProducts` use case — returns the whole catalog. */

import { inject, injectable, token } from "@codefast/di";

import { ProductRepositoryToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import type { ProductRepository } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import type { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";

/** Returns every product through the repository port. */
@injectable([inject(ProductRepositoryToken)])
export class ListProducts {
  constructor(private readonly products: ProductRepository) {}

  async execute(): Promise<ReadonlyArray<Product>> {
    return this.products.findAll();
  }
}

/** The injection token that resolves the `ListProducts` use case. */
export const ListProductsToken = token<ListProducts>("ListProducts");
