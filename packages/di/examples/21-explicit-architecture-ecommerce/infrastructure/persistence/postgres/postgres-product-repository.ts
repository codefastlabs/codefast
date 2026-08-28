/** A `ProductRepository` adapter that talks to the mock `PgPool` while storing rows in memory. */

import { inject, injectable } from "@codefast/di";

import type { ProductRepository } from "#/examples/21-explicit-architecture-ecommerce/application/ports/product-repository";
import type { Product } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product";
import type { ProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";
import { PgPoolToken } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/postgres/pg-pool";
import type { PgPool } from "#/examples/21-explicit-architecture-ecommerce/infrastructure/persistence/postgres/pg-pool";

/** Persists products through Postgres SQL; the mock pool logs each statement and an in-memory map holds the rows. */
@injectable([inject(PgPoolToken)])
export class PostgresProductRepository implements ProductRepository {
  readonly #store = new Map<ProductId, Product>();

  constructor(private readonly pool: PgPool) {}

  async findById(id: ProductId): Promise<Product | undefined> {
    await this.pool.query("SELECT * FROM products WHERE id = $1", [id]);

    return this.#store.get(id);
  }

  async findAll(): Promise<ReadonlyArray<Product>> {
    await this.pool.query("SELECT * FROM products");

    return [...this.#store.values()];
  }

  async save(product: Product): Promise<void> {
    await this.pool.query("INSERT INTO products (id, name, price, stock) VALUES ($1, $2, $3, $4)", [product.id]);
    this.#store.set(product.id, product);
  }
}
