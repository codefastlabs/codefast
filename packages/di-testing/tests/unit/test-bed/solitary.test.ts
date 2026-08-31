import { describe, expect, it, vi } from "vitest";

import { TestBed } from "#/test-bed/test-bed";
import {
  AccessorConsumer,
  DoubleLogger,
  EmailServiceToken,
  LoggerToken,
  NamedConsumer,
  OrderProcessor,
  PaymentGatewayToken,
  PluginToken,
  ReportService,
  Standalone,
  TaggedConsumer,
  UserServiceToken,
} from "#/tests/unit/support/fixtures";

describe("TestBed.solitary", () => {
  it("auto-mocks every constructor dependency (zero-dep backend)", () => {
    const { unit, unitRef } = TestBed.solitary(OrderProcessor)
      .mock(UserServiceToken)
      .impl((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "alice@example.com" }) }))
      .compile();

    const orderId = unit.placeOrder("u1", 42);

    expect(orderId).toBe("ord-u1");
    expect(unitRef.get(PaymentGatewayToken).charge.mock.calls.at(0)).toEqual(["u1", 42]);
    expect(unitRef.get(EmailServiceToken).send.mock.calls.at(0)).toEqual(["alice@example.com", "Order confirmed — 42"]);
  });

  it("works with a Vitest mock factory and its matchers", () => {
    const { unit, unitRef } = TestBed.solitary(OrderProcessor, { mockFactory: () => vi.fn() })
      .mock(UserServiceToken)
      .impl((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "alice@example.com" }) }))
      .compile();

    unit.placeOrder("u1", 7);

    expect(unitRef.get(PaymentGatewayToken).charge).toHaveBeenCalledWith("u1", 7);
    expect(unitRef.get(EmailServiceToken).send).toHaveBeenCalledWith("alice@example.com", "Order confirmed — 7");
  });

  it("shares one mock across duplicate tokens", () => {
    const { unit, unitRef } = TestBed.solitary(DoubleLogger).compile();

    expect(unit.first).toBe(unit.second);
    expect(unit.first).toBe(unitRef.get(LoggerToken));
  });

  it("resolves a named dependency", () => {
    const { unit, unitRef } = TestBed.solitary(NamedConsumer).compile();

    expect(unit.logger).toBe(unitRef.get(LoggerToken));
  });

  it("resolves a tagged dependency", () => {
    const { unit, unitRef } = TestBed.solitary(TaggedConsumer).compile();

    expect(unit.logger).toBe(unitRef.get(LoggerToken));
  });

  it("resolves an accessor-injected dependency", () => {
    const { unit, unitRef } = TestBed.solitary(AccessorConsumer).compile();
    unit.notify("bob@example.com");

    expect(unitRef.get(EmailServiceToken).send.mock.calls.at(0)).toEqual(["bob@example.com", "hello"]);
  });

  it("mocks optional and multi dependencies", () => {
    const { unit, unitRef } = TestBed.solitary(ReportService).compile();

    expect(unit.logger).toBe(unitRef.get(LoggerToken));
    expect(unit.plugins).toEqual([unitRef.get(PluginToken)]);
    expect(unit.pluginCount()).toBe(1);
  });

  it("compiles a dependency-free unit", () => {
    const { unit } = TestBed.solitary(Standalone).compile();
    expect(unit.ping()).toBe("pong");
  });

  it("builds the unit through compileAsync", async () => {
    const { unit, unitRef } = await TestBed.solitary(OrderProcessor)
      .mock(UserServiceToken)
      .impl((fn) => ({ findUser: fn().mockReturnValue({ id: "u1", email: "alice@example.com" }) }))
      .compileAsync();

    unit.placeOrder("u1", 9);

    expect(unitRef.get(PaymentGatewayToken).charge.mock.calls.at(0)).toEqual(["u1", 9]);
  });
});
