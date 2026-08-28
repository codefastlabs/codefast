/** The `Product` entity — a catalog item that owns its own stock invariant. */

import { OutOfStockError } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/catalog-errors";
import type { ProductId } from "#/examples/21-explicit-architecture-ecommerce/domain/catalog/product-id";
import type { Money } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/money";

/** A sellable catalog item; stock only decreases through `reserve`, which enforces availability. */
export class Product {
  #stock: number;

  private constructor(
    readonly id: ProductId,
    readonly name: string,
    readonly unitPrice: Money,
    stock: number,
  ) {
    this.#stock = stock;
  }

  /** Lists a product with an opening `stock`. */
  static list(id: ProductId, name: string, unitPrice: Money, stock: number): Product {
    return new Product(id, name, unitPrice, stock);
  }

  /** The number of units currently available. */
  get stock(): number {
    return this.#stock;
  }

  /** Removes `quantity` units from stock, refusing to oversell. */
  reserve(quantity: number): void {
    if (quantity > this.#stock) {
      throw new OutOfStockError(this.id, quantity, this.#stock);
    }

    this.#stock -= quantity;
  }
}
