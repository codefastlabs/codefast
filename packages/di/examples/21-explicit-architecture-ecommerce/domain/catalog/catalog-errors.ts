/** The catalog error taxonomy — failures the catalog rules raise. */

import { DomainError } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/domain-error";

/** Raised when a catalog lookup finds no product for an id. */
export class ProductNotFoundError extends DomainError {
  constructor(productId: string) {
    super("PRODUCT_NOT_FOUND", `No product with id ${productId}`);
    this.name = "ProductNotFoundError";
  }
}

/** Raised when an order asks for more units than a product has in stock. */
export class OutOfStockError extends DomainError {
  constructor(productId: string, requested: number, available: number) {
    super("OUT_OF_STOCK", `Product ${productId}: requested ${requested}, only ${available} in stock`);
    this.name = "OutOfStockError";
  }
}
