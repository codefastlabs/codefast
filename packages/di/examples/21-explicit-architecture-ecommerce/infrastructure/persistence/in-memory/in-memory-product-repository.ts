/** A `ProductRepository` adapter backed by an in-memory map — the seam a real database would replace. */

import { injectable } from "@codefast/di";

import type { ProductRepository } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import type { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";
import type { ProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";

/** Keeps products in a `Map`; swap it for the Postgres adapter and no domain or use-case code changes. */
@injectable()
export class InMemoryProductRepository implements ProductRepository {
  readonly #store = new Map<ProductId, Product>();

  async findById(id: ProductId): Promise<Product | undefined> {
    return this.#store.get(id);
  }

  async findAll(): Promise<ReadonlyArray<Product>> {
    return [...this.#store.values()];
  }

  async save(product: Product): Promise<void> {
    this.#store.set(product.id, product);
  }
}
