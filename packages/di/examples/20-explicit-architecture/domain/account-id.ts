/** The `AccountId` branded identifier and its constructor. */

/** A string that has been vetted as an account identifier — distinct from a plain `string` at the type level. */
export type AccountId = string & { readonly __brand: "AccountId" };

/** Brands a raw string as an `AccountId`. */
export function toAccountId(raw: string): AccountId {
  return raw as AccountId;
}
