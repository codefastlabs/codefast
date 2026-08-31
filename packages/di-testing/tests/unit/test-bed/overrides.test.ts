import { describe, expect, it } from "vitest";

import { UndeclaredDependencyError } from "#/errors/errors";
import { TestBed } from "#/test-bed/test-bed";
import type { EmailService } from "#/tests/unit/support/fixtures";
import {
  EmailServiceToken,
  LoggerToken,
  OrderProcessor,
  PaymentGatewayToken,
  UserServiceToken,
} from "#/tests/unit/support/fixtures";

describe("TestBed.solitary overrides", () => {
  it("binds a fixed value with .using()", () => {
    const sent: Array<string> = [];
    const email: EmailService = { send: (to) => sent.push(to) };

    const { unit, unitRef } = TestBed.solitary(OrderProcessor)
      .mock(UserServiceToken)
      .impl((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "alice@example.com" }) }))
      .mock(EmailServiceToken)
      .using(email)
      .compile();

    unit.placeOrder("u1", 5);

    expect(unitRef.get(EmailServiceToken)).toBe(email);
    expect(sent).toEqual(["alice@example.com"]);
  });

  it("keeps unlisted members auto-mocked when using .impl()", () => {
    const { unitRef } = TestBed.solitary(OrderProcessor)
      .mock(PaymentGatewayToken)
      .impl(() => ({}))
      .compile();

    // `charge` was not stubbed, so it is still an auto-mock spy that records calls.
    unitRef.get(PaymentGatewayToken).charge("u1", 1);
    expect(unitRef.get(PaymentGatewayToken).charge.mock.calls.at(0)).toEqual(["u1", 1]);
  });

  it("lets the last override for a token win", () => {
    const first: EmailService = { send: () => undefined };
    const second: EmailService = { send: () => undefined };

    const { unitRef } = TestBed.solitary(OrderProcessor)
      .mock(EmailServiceToken)
      .using(first)
      .mock(EmailServiceToken)
      .using(second)
      .compile();

    expect(unitRef.get(EmailServiceToken)).toBe(second);
  });

  it("rejects an override for a non-dependency", () => {
    expect(() =>
      TestBed.solitary(OrderProcessor)
        .mock(LoggerToken)
        .using({ log: () => undefined })
        .compile(),
    ).toThrow(UndeclaredDependencyError);
  });

  it("rejects a lookup for a non-dependency", () => {
    const { unitRef } = TestBed.solitary(OrderProcessor).compile();
    expect(() => unitRef.get(LoggerToken)).toThrow(UndeclaredDependencyError);
  });
});
