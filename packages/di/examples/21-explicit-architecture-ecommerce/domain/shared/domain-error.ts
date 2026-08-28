/** The shared base of the domain error taxonomy, plus the cross-cutting currency error. */

/** A violation of a domain rule, carrying a stable `code` for callers to branch on. */
export class DomainError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

/** Raised when two `Money` values of different currencies are combined. */
export class CurrencyMismatchError extends DomainError {
  constructor(left: string, right: string) {
    super("CURRENCY_MISMATCH", `Cannot combine ${left} with ${right}`);
    this.name = "CurrencyMismatchError";
  }
}
