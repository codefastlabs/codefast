import { defaultMetadataReader } from "@codefast/di";
import { describe, expect, it } from "vitest";

import { scanDependencies } from "#/discovery/dependency-scanner";
import { NotInjectableError } from "#/errors/errors";
import {
  AccessorConsumer,
  AccessorOnlyService,
  DoubleLogger,
  EmailServiceToken,
  LoggerToken,
  OrderProcessor,
  PaymentGatewayToken,
  PlainStandalone,
  Standalone,
  Undecorated,
  UserServiceToken,
} from "#/tests/unit/support/fixtures";

describe("scanDependencies", () => {
  it("reads every constructor dependency in order", () => {
    const slots = scanDependencies(OrderProcessor, defaultMetadataReader);

    expect(slots.map((slot) => slot.token)).toEqual([UserServiceToken, PaymentGatewayToken, EmailServiceToken]);
  });

  it("reads accessor-injected dependencies", () => {
    const slots = scanDependencies(AccessorConsumer, defaultMetadataReader);

    expect(slots.map((slot) => slot.token)).toContain(EmailServiceToken);
  });

  it("reads an accessor-only class that has no @injectable", () => {
    const slots = scanDependencies(AccessorOnlyService, defaultMetadataReader);

    expect(slots.map((slot) => slot.token)).toEqual([EmailServiceToken]);
  });

  it("keeps duplicate tokens as separate slots", () => {
    const slots = scanDependencies(DoubleLogger, defaultMetadataReader);

    expect(slots.map((slot) => slot.token)).toEqual([LoggerToken, LoggerToken]);
  });

  it("returns an empty list for a dependency-free unit", () => {
    expect(scanDependencies(Standalone, defaultMetadataReader)).toEqual([]);
  });

  it("returns an empty list for an undecorated zero-argument class", () => {
    expect(scanDependencies(PlainStandalone, defaultMetadataReader)).toEqual([]);
  });

  it("throws NotInjectableError for an undecorated class whose constructor takes parameters", () => {
    expect(() => scanDependencies(Undecorated, defaultMetadataReader)).toThrow(NotInjectableError);
  });
});
