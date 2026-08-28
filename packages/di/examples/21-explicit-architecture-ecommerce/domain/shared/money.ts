/** The `Money` value object — an immutable amount in minor units, closed under same-currency arithmetic. */

import { CurrencyMismatchError } from "#/examples/21-explicit-architecture-ecommerce/domain/shared/domain-error";

/** An immutable amount of a single currency, stored in minor units to avoid floating-point drift. */
export class Money {
  private constructor(
    readonly amountMinor: number,
    readonly currency: string,
  ) {}

  /** A `Money` of `major` whole units of `currency` (e.g. `Money.of(1, "USD")` is 100 cents). */
  static of(major: number, currency: string): Money {
    return new Money(Math.round(major * 100), currency);
  }

  /** A zero balance in `currency`. */
  static zero(currency: string): Money {
    return new Money(0, currency);
  }

  /** The sum of two same-currency amounts. */
  add(other: Money): Money {
    this.#assertSameCurrency(other);

    return new Money(this.amountMinor + other.amountMinor, this.currency);
  }

  /** This amount repeated `quantity` times — the line total for `quantity` units. */
  multiply(quantity: number): Money {
    return new Money(this.amountMinor * quantity, this.currency);
  }

  /** Whether this amount is strictly smaller than `other`. */
  isLessThan(other: Money): boolean {
    this.#assertSameCurrency(other);

    return this.amountMinor < other.amountMinor;
  }

  /** A human-readable rendering such as `USD 12.00`. */
  toString(): string {
    return `${this.currency} ${(this.amountMinor / 100).toFixed(2)}`;
  }

  #assertSameCurrency(other: Money): void {
    if (this.currency !== other.currency) {
      throw new CurrencyMismatchError(this.currency, other.currency);
    }
  }
}
