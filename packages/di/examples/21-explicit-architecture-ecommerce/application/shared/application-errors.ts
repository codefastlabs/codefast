/** The application error taxonomy — failures orchestration raises, distinct from domain-rule violations. */

/** A failure in an application use case, carrying a stable `code`. */
export class ApplicationError extends Error {
  readonly code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = "ApplicationError";
    this.code = code;
  }
}

/** Raised when no configured gateway can settle the requested currency. */
export class UnsupportedCurrencyError extends ApplicationError {
  constructor(currency: string) {
    super("UNSUPPORTED_CURRENCY", `No payment gateway supports ${currency}`);
    this.name = "UnsupportedCurrencyError";
  }
}

/** Raised when the selected gateway declines the charge. */
export class PaymentDeclinedError extends ApplicationError {
  constructor(orderId: string) {
    super("PAYMENT_DECLINED", `Payment was declined for order ${orderId}`);
    this.name = "PaymentDeclinedError";
  }
}
