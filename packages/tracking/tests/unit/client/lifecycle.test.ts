import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { attachClientLifecycle } from "#/client/lifecycle";

describe("attachClientLifecycle", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("flushes on the configured interval", () => {
    const flush = vi.fn();
    const detach = attachClientLifecycle({ flush, flushWithBeacon: vi.fn() }, { flushIntervalMs: 1000 });

    vi.advanceTimersByTime(2500);
    expect(flush).toHaveBeenCalledTimes(2);

    detach();
    vi.advanceTimersByTime(5000);
    expect(flush).toHaveBeenCalledTimes(2);
  });

  it("flushes via beacon when the page becomes hidden", () => {
    const flushWithBeacon = vi.fn();
    const detach = attachClientLifecycle({ flush: vi.fn(), flushWithBeacon }, { beaconEndpoint: "/api/events" });

    Object.defineProperty(document, "visibilityState", { configurable: true, value: "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));

    expect(flushWithBeacon).toHaveBeenCalledWith("/api/events");

    detach();
  });

  it("flushes via beacon on pagehide", () => {
    const flushWithBeacon = vi.fn();
    const detach = attachClientLifecycle({ flush: vi.fn(), flushWithBeacon }, { beaconEndpoint: "/api/events" });

    window.dispatchEvent(new Event("pagehide"));

    expect(flushWithBeacon).toHaveBeenCalledWith("/api/events");

    detach();
  });

  it("skips the beacon flush when no endpoint is configured", () => {
    const flushWithBeacon = vi.fn();
    const detach = attachClientLifecycle({ flush: vi.fn(), flushWithBeacon });

    window.dispatchEvent(new Event("pagehide"));

    expect(flushWithBeacon).not.toHaveBeenCalled();

    detach();
  });
});
