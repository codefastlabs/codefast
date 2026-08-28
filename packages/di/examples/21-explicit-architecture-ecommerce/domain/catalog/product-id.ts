/** The `ProductId` branded identifier and its constructor. */

/** A string vetted as a product identifier — distinct from a plain `string` at the type level. */
export type ProductId = string & { readonly __brand: "ProductId" };

/** Brands a raw string as a `ProductId`. */
export function toProductId(raw: string): ProductId {
  return raw as ProductId;
}
