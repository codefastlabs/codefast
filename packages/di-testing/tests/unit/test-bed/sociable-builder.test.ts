import { describe, expect, it, vi } from "vitest";

import { ExposureError, OverrideMismatchError, SealedDependencyError } from "#/errors/errors";
import { TestBed } from "#/test-bed/test-bed";
import {
  BundleService,
  CheckoutService,
  DiscountPolicy,
  LifecycleHost,
  LifecycleService,
  LoggerToken,
  NamedPricingHost,
  TaggedPricingHost,
  PaymentGatewayToken,
  PricingService,
  Standalone,
  TaxPolicyToken,
  ThrowingHost,
  ThrowingService,
} from "#/tests/unit/support/fixtures";

describe("TestBed.sociable", () => {
  const bedFor = () =>
    TestBed.sociable(CheckoutService, { mockFactory: () => vi.fn() })
      .expose(PricingService)
      .mock(TaxPolicyToken)
      .stub((fn) => ({ rateFor: fn().mockReturnValue(0.1) }));

  it("keeps the exposed collaborator real while tokens stay mocked", () => {
    const { unit, mocks } = bedFor()
      .mock(DiscountPolicy)
      .stub((fn) => ({ off: fn().mockReturnValue(50) }))
      .compile();

    const total = unit.checkout(100, "USD");

    // Real PricingService math runs over the stubbed tax boundary.
    expect(total).toBeCloseTo(55);
    expect(mocks.get(PaymentGatewayToken).charge).toHaveBeenCalledWith("order-1", total);
    expect(mocks.get(TaxPolicyToken).rateFor).toHaveBeenCalledWith("USD");
  });

  it("exposes a whole real subtree when every class is exposed", () => {
    const { unit } = bedFor().expose(DiscountPolicy).compile();

    // The real discount and the real pricing both apply.
    expect(unit.checkout(100, "USD")).toBeCloseTo(99);
  });

  it("mocks a class dependency of an exposed class unless it is exposed too", () => {
    const { mocks } = bedFor().compile();

    // DiscountPolicy was not exposed, so it is a retrievable auto-mock.
    expect(mocks.get(DiscountPolicy).off).not.toHaveBeenCalled();
  });

  it("hands back the real exposed instance the unit was built with", () => {
    const bed = bedFor().expose(DiscountPolicy).compile();
    const pricing = bed.exposed(PricingService);

    expect(bed.exposed(PricingService)).toBe(pricing);
    expect(pricing.total(100, "USD")).toBeCloseTo(99);
  });

  it("seals exposed classes on mocks.get", () => {
    const bed = bedFor().compile();

    expect(() => bed.mocks.get(PricingService)).toThrow(SealedDependencyError);
  });

  it("rejects exposed() for a class that was not exposed", () => {
    const bed = bedFor().compile();

    expect(() => bed.exposed(DiscountPolicy)).toThrow(ExposureError);
  });

  it("rejects an exposed class the unit never reaches", () => {
    expect(() => bedFor().expose(Standalone).compile()).toThrow(ExposureError);
  });

  it("rejects exposing and mocking the same class", () => {
    expect(() =>
      bedFor()
        .mock(PricingService)
        .stub(() => ({}))
        .compile(),
    ).toThrow(OverrideMismatchError);
  });

  it("runs the exposed collaborator's lifecycle through the container", async () => {
    const bed = TestBed.sociable(LifecycleHost, { mockFactory: () => vi.fn() })
      .expose(LifecycleService)
      .compile();
    const log = bed.mocks.get(LoggerToken);

    expect(log.log).toHaveBeenCalledWith("start");

    await bed.dispose();

    expect(log.log).toHaveBeenCalledWith("stop");
  });

  it("compiles asynchronously with the same wiring", async () => {
    const { unit } = await bedFor().expose(DiscountPolicy).compileAsync();

    expect(unit.checkout(100, "USD")).toBeCloseTo(99);
  });

  it("shares one real instance across a diamond of exposed paths", () => {
    const bed = TestBed.sociable(BundleService, { mockFactory: () => vi.fn() })
      .expose(PricingService)
      .expose(DiscountPolicy)
      .mock(TaxPolicyToken)
      .stub((fn) => ({ rateFor: fn().mockReturnValue(0) }))
      .compile();

    // The unit's direct DiscountPolicy and the one inside PricingService are the same singleton.
    expect(bed.unit.discount).toBe(bed.exposed(DiscountPolicy));
    expect(bed.unit.pricing.total(100, "USD")).toBeCloseTo(90);
  });

  it("propagates an exposed collaborator's @postConstruct failure out of both compiles", async () => {
    expect(() => TestBed.sociable(ThrowingHost).expose(ThrowingService).compile()).toThrow("boot failed");
    await expect(TestBed.sociable(ThrowingHost).expose(ThrowingService).compileAsync()).rejects.toThrow("boot failed");
  });

  it("keeps a collaborator exposed through a named slot real and singular", () => {
    const bed = TestBed.sociable(NamedPricingHost, { mockFactory: () => vi.fn() })
      .expose(PricingService)
      .mock(TaxPolicyToken)
      .stub((fn) => ({ rateFor: fn().mockReturnValue(0) }))
      .mock(DiscountPolicy)
      .stub((fn) => ({ off: fn().mockReturnValue(80) }))
      .compile();

    // The named slot received the same real singleton bed.exposed() hands back.
    expect(bed.unit.pricing).toBe(bed.exposed(PricingService));
    expect(bed.unit.pricing.total(100, "USD")).toBeCloseTo(80);
  });

  it("keeps a collaborator exposed through a tagged slot real and singular", () => {
    const bed = TestBed.sociable(TaggedPricingHost, { mockFactory: () => vi.fn() })
      .expose(PricingService)
      .mock(TaxPolicyToken)
      .stub((fn) => ({ rateFor: fn().mockReturnValue(0) }))
      .mock(DiscountPolicy)
      .stub((fn) => ({ off: fn().mockReturnValue(80) }))
      .compile();

    expect(bed.unit.pricing).toBe(bed.exposed(PricingService));
  });

  it("rejects exposing the unit under test itself", () => {
    expect(() => TestBed.sociable(CheckoutService).expose(CheckoutService).compile()).toThrow(ExposureError);
  });
});
