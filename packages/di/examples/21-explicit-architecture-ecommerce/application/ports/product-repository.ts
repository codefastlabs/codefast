/** The outbound port through which the application loads and stores catalog products. */

import { token } from "@codefast/di";

import type { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";
import type { ProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";

/** Persists and retrieves `Product` aggregates, hiding the storage engine behind it. */
export interface ProductRepository {
  /** The product with `id`, or `undefined` when none is stored. */
  findById(id: ProductId): Promise<Product | undefined>;

  /** Every product in the catalog. */
  findAll(): Promise<ReadonlyArray<Product>>;

  /** Persists the current state of `product`. */
  save(product: Product): Promise<void>;
}

/** The injection token that binds the `ProductRepository` port to its adapter. */
export const ProductRepositoryToken = token<ProductRepository>("ProductRepository");
