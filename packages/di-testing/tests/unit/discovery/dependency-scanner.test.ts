import { defaultMetadataReader } from "@codefast/di";
import { describe, expect, it } from "vitest";

import { scanDependencies } from "#/discovery/dependency-scanner";
import { NotInjectableError } from "#/errors/errors";
import {
  AccessorConsumer,
  DoubleLogger,
  EmailServiceToken,
  LoggerToken,
  OrderProcessor,
  PaymentGatewayToken,
  Standalone,
  Undecorated,
  UserServiceToken,
} from "#/tests/unit/support/fixtures";

describe("scanDependencies", () => {
  it("reads every constructor dependency in order", () => {
    const deps = scanDependencies(OrderProcessor, defaultMetadataReader);

    expect(deps.map((dep) => dep.slot.token)).toEqual([UserServiceToken, PaymentGatewayToken, EmailServiceToken]);
    expect(deps.every((dep) => dep.source === "constructor")).toBe(true);
  });

  it("reads accessor-injected dependencies", () => {
    const deps = scanDependencies(AccessorConsumer, defaultMetadataReader);

    expect(deps).toContainEqual(expect.objectContaining({ source: "accessor" }));
    expect(deps.map((dep) => dep.slot.token)).toContain(EmailServiceToken);
  });

  it("keeps duplicate tokens as separate slots", () => {
    const deps = scanDependencies(DoubleLogger, defaultMetadataReader);

    expect(deps.map((dep) => dep.slot.token)).toEqual([LoggerToken, LoggerToken]);
  });

  it("returns an empty list for a dependency-free unit", () => {
    expect(scanDependencies(Standalone, defaultMetadataReader)).toEqual([]);
  });

  it("throws NotInjectableError for an undecorated class", () => {
    expect(() => scanDependencies(Undecorated, defaultMetadataReader)).toThrow(NotInjectableError);
  });
});
