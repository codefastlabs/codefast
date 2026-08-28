/** The `OrderId` branded identifier and its constructor. */

/** A string vetted as an order identifier — distinct from a plain `string` at the type level. */
export type OrderId = string & { readonly __brand: "OrderId" };

/** Brands a raw string as an `OrderId`. */
export function toOrderId(raw: string): OrderId {
  return raw as OrderId;
}
