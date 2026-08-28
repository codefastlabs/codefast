/** The domain error taxonomy — failures the business rules raise, independent of any adapter. */

// ── Errors ───────────────────────────────────────────────────────────────────────────────────────────────────────────

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

/** Raised when an account is asked to release more than its balance. */
export class InsufficientFundsError extends DomainError {
  constructor(balance: string, requested: string) {
    super("INSUFFICIENT_FUNDS", `Balance ${balance} cannot cover ${requested}`);
    this.name = "InsufficientFundsError";
  }
}

/** Raised when a use case references an account that no repository holds. */
export class AccountNotFoundError extends DomainError {
  constructor(accountId: string) {
    super("ACCOUNT_NOT_FOUND", `No account with id ${accountId}`);
    this.name = "AccountNotFoundError";
  }
}
