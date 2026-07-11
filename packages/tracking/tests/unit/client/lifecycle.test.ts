import { describe, expect, it, vi } from "vitest";

import { attachClientLifecycle } from "#/client/lifecycle";

describe("attachClientLifecycle", () => {
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

  it("falls back to a keepalive flush on unload when no beacon endpoint is configured", () => {
    const flush = vi.fn().mockResolvedValue(undefined);
    const flushWithBeacon = vi.fn();
    const detach = attachClientLifecycle({ flush, flushWithBeacon });

    window.dispatchEvent(new Event("pagehide"));

    expect(flushWithBeacon).not.toHaveBeenCalled();
    expect(flush).toHaveBeenCalledWith({ keepalive: true });

    detach();
  });

  it("flushes when connectivity returns", () => {
    const flush = vi.fn().mockResolvedValue(undefined);
    const detach = attachClientLifecycle({ flush, flushWithBeacon: vi.fn() });

    window.dispatchEvent(new Event("online"));

    expect(flush).toHaveBeenCalledTimes(1);

    detach();
  });

  it("removes every listener on detach", () => {
    const flush = vi.fn().mockResolvedValue(undefined);
    const flushWithBeacon = vi.fn();
    const detach = attachClientLifecycle({ flush, flushWithBeacon }, { beaconEndpoint: "/api/events" });

    detach();

    window.dispatchEvent(new Event("pagehide"));
    window.dispatchEvent(new Event("online"));

    expect(flushWithBeacon).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });
});
