/** The `GetProduct` use case — fetches a single product or fails with a domain error. */

import { inject, injectable, token } from "@codefast/di";

import { ProductRepositoryToken } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import type { ProductRepository } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import { ProductNotFoundError } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/catalog-errors";
import type { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";
import { toProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";

/** Loads one product by id through the repository port. */
@injectable([inject(ProductRepositoryToken)])
export class GetProduct {
  constructor(private readonly products: ProductRepository) {}

  async execute(productId: string): Promise<Product> {
    const product = await this.products.findById(toProductId(productId));

    if (product === undefined) {
      throw new ProductNotFoundError(productId);
    }

    return product;
  }
}

/** The injection token that resolves the `GetProduct` use case. */
export const GetProductToken = token<GetProduct>("GetProduct");
