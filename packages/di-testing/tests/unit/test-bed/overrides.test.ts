import { describe, expect, it } from "vitest";

import { OverrideMismatchError, SealedDependencyError, UndeclaredDependencyError } from "#/errors/errors";
import { TestBed } from "#/test-bed/test-bed";
import type { EmailService, Plugin } from "#/tests/unit/support/fixtures";
import {
  DualLoggerConsumer,
  EmailServiceToken,
  EnvTag,
  LoggerToken,
  NamedConsumer,
  OrderProcessor,
  PaymentGatewayToken,
  PluginToken,
  RepeatedSlotsConsumer,
  ReportService,
  UserServiceToken,
} from "#/tests/unit/support/fixtures";

describe("TestBed.solitary overrides", () => {
  it("binds a fixed value with .using() and seals it", () => {
    const sent: Array<string> = [];
    const email: EmailService = { send: (to) => void sent.push(to) };

    const { unit, mocks } = TestBed.solitary(OrderProcessor)
      .mock(UserServiceToken)
      .stub((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "alice@example.com" }) }))
      .mock(EmailServiceToken)
      .using(email)
      .compile();

    unit.placeOrder("u1", 5);

    expect(sent).toEqual(["alice@example.com"]);
    // Sealed: the value carries no mock surface, so retrieving it as Mocked would lie.
    expect(() => mocks.get(EmailServiceToken)).toThrow(SealedDependencyError);
  });

  it("keeps unlisted members auto-mocked when using .stub()", () => {
    const { mocks } = TestBed.solitary(OrderProcessor)
      .mock(PaymentGatewayToken)
      .stub(() => ({}))
      .compile();

    // `charge` was not stubbed, so it is still an auto-mock spy that records calls.
    mocks.get(PaymentGatewayToken).charge("u1", 1);
    expect(mocks.get(PaymentGatewayToken).charge.mock.calls.at(0)).toEqual(["u1", 1]);
  });

  it("lets the last override for a token win", () => {
    const first: Array<string> = [];
    const second: Array<string> = [];

    const { unit } = TestBed.solitary(OrderProcessor)
      .mock(UserServiceToken)
      .stub((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "a@b.c" }) }))
      .mock(EmailServiceToken)
      .using({ send: (to) => void first.push(to) })
      .mock(EmailServiceToken)
      .using({ send: (to) => void second.push(to) })
      .compile();

    unit.placeOrder("u1", 5);

    expect(first).toEqual([]);
    expect(second).toEqual(["a@b.c"]);
  });

  it("targets one slot of a token with .mock(token, { name })", () => {
    const { unit, mocks } = TestBed.solitary(DualLoggerConsumer)
      .mock(LoggerToken, { name: "primary" })
      .stub(() => ({}))
      .compile();

    expect(unit.primary).not.toBe(unit.plain);
    expect(unit.primary).toBe(mocks.get(LoggerToken, { name: "primary" }));
    expect(unit.plain).toBe(mocks.get(LoggerToken));

    unit.primary.log("only primary");
    expect(mocks.get(LoggerToken, { name: "primary" }).log.mock.calls).toEqual([["only primary"]]);
    expect(mocks.get(LoggerToken).log.mock.calls).toEqual([]);
  });

  it("leaves an optional dependency absent with .absent()", () => {
    const { unit } = TestBed.solitary(ReportService).mock(LoggerToken).absent().compile();

    expect(unit.logger).toBeUndefined();
  });

  it("empties an injectAll slot with .absent()", () => {
    const { unit } = TestBed.solitary(ReportService).mock(PluginToken).absent().compile();

    expect(unit.plugins).toEqual([]);
  });

  it("supplies injectAll elements in order with .all()", () => {
    const alpha: Plugin = { name: "alpha" };
    const beta: Plugin = { name: "beta" };

    const { unit, mocks } = TestBed.solitary(ReportService).mock(PluginToken).usingAll([alpha, beta]).compile();

    expect(unit.plugins).toEqual([alpha, beta]);
    expect(() => mocks.get(PluginToken)).toThrow(SealedDependencyError);
  });

  it("rejects .absent() on a required dependency", () => {
    expect(() => TestBed.solitary(OrderProcessor).mock(EmailServiceToken).absent().compile()).toThrow(
      OverrideMismatchError,
    );
  });

  it("rejects .all() on a dependency that is not an unconstrained injectAll", () => {
    expect(() =>
      TestBed.solitary(OrderProcessor)
        .mock(EmailServiceToken)
        .usingAll([{ send: () => undefined }])
        .compile(),
    ).toThrow(OverrideMismatchError);
  });

  it("rejects an override for a non-dependency", () => {
    expect(() =>
      TestBed.solitary(OrderProcessor)
        .mock(LoggerToken)
        .using({ log: () => undefined })
        .compile(),
    ).toThrow(UndeclaredDependencyError);
  });

  it("rejects an override whose slot matches nothing", () => {
    expect(() =>
      TestBed.solitary(DualLoggerConsumer)
        .mock(LoggerToken, { name: "backup" })
        .stub(() => ({}))
        .compile(),
    ).toThrow(UndeclaredDependencyError);
  });

  it("rejects an override whose tagged slot matches nothing", () => {
    expect(() =>
      TestBed.solitary(DualLoggerConsumer)
        .mock(LoggerToken, { tag: EnvTag.of("nowhere") })
        .stub(() => ({}))
        .compile(),
    ).toThrow(UndeclaredDependencyError);
  });

  it("treats empty options as the token-level override", () => {
    const sent: Array<string> = [];

    const { unit } = TestBed.solitary(OrderProcessor)
      .mock(UserServiceToken)
      .stub((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "a@b.c" }) }))
      .mock(EmailServiceToken, {})
      .using({ send: (to) => void sent.push(to) })
      .compile();

    unit.placeOrder("u1", 5);
    expect(sent).toEqual(["a@b.c"]);
  });

  it("lets the last override for one slot win", () => {
    const { unit, mocks } = TestBed.solitary(DualLoggerConsumer)
      .mock(LoggerToken, { name: "primary" })
      .stub(() => ({ log: () => undefined }))
      .mock(LoggerToken, { name: "primary" })
      .stub(() => ({}))
      .compile();

    // The second .stub replaced the first, so log is an auto-mock spy again.
    unit.primary.log("kept");
    expect(mocks.get(LoggerToken, { name: "primary" }).log.mock.calls).toEqual([["kept"]]);
  });

  it("falls back to the lone slotted mock when get() has no criteria", () => {
    const { unit, mocks } = TestBed.solitary(NamedConsumer)
      .mock(LoggerToken, { name: "primary" })
      .stub(() => ({}))
      .compile();

    expect(mocks.get(LoggerToken)).toBe(unit.logger);
  });

  it("rejects a lookup for a slot that has no mock", () => {
    const { mocks } = TestBed.solitary(NamedConsumer).compile();

    expect(() => mocks.get(LoggerToken, { name: "backup" })).toThrow(UndeclaredDependencyError);
  });

  it("rejects a lookup for a non-dependency", () => {
    const { mocks } = TestBed.solitary(OrderProcessor).compile();
    expect(() => mocks.get(LoggerToken)).toThrow(UndeclaredDependencyError);
  });

  it("resets every auto-mock the bed created, skipping sealed values", () => {
    const bed = TestBed.solitary(OrderProcessor)
      .mock(UserServiceToken)
      .stub((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "a@b.c" }) }))
      .mock(EmailServiceToken)
      .using({ send: () => undefined })
      .compile();

    bed.unit.placeOrder("u1", 5);
    expect(bed.mocks.get(PaymentGatewayToken).charge.mock.calls).toHaveLength(1);

    bed.resetMocks();

    expect(bed.mocks.get(PaymentGatewayToken).charge.mock.calls).toEqual([]);
  });

  it("consumes one override across repeated slots of every kind", () => {
    const alpha: Plugin = { name: "alpha" };

    const { unit, mocks } = TestBed.solitary(RepeatedSlotsConsumer)
      .mock(LoggerToken)
      .absent()
      .mock(PluginToken)
      .usingAll([alpha])
      .mock(EmailServiceToken, { name: "outbox" })
      .stub(() => ({}))
      .mock(EmailServiceToken, { name: "inbox" })
      .stub(() => ({}))
      .compile();

    expect(unit.firstLogger).toBeUndefined();
    expect(unit.secondLogger).toBeUndefined();
    expect(unit.pluginsA).toEqual([alpha]);
    expect(unit.pluginsB).toEqual([alpha]);
    // Both outbox slots share the one slot-targeted mock; inbox has its own.
    expect(unit.outboxA).toBe(unit.outboxB);
    expect(unit.outboxA).not.toBe(unit.inbox);
    expect(mocks.get(EmailServiceToken, { name: "inbox" })).toBe(unit.inbox);
    // Every slot is covered by a slotted override, so a slotless lookup has nothing to return.
    expect(() => mocks.get(EmailServiceToken)).toThrow(UndeclaredDependencyError);
  });

  it("rejects a token-level override fully shadowed by slotted ones", () => {
    expect(() =>
      TestBed.solitary(RepeatedSlotsConsumer)
        .mock(EmailServiceToken, { name: "outbox" })
        .stub(() => ({}))
        .mock(EmailServiceToken, { name: "inbox" })
        .stub(() => ({}))
        .mock(EmailServiceToken)
        .using({ send: () => undefined })
        .compile(),
    ).toThrow(UndeclaredDependencyError);
  });
});
