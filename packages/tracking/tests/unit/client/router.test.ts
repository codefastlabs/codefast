import { describe, expect, it, vi } from "vitest";

import { attachRouterPageTracking } from "#/client/router";
import type { RouterLike } from "#/client/router";

function createFakeRouter(): RouterLike & {
  emit: (event: { toLocation: { href: string; pathname: string } }) => void;
} {
  let listener: ((event: { toLocation: { href: string; pathname: string } }) => void) | undefined;

  return {
    emit(event) {
      listener?.(event);
    },
    subscribe(eventType, fn) {
      expect(eventType).toBe("onResolved");
      listener = fn;

      return () => {
        listener = undefined;
      };
    },
  };
}

describe("attachRouterPageTracking", () => {
  it("calls tracker.page with the resolved pathname and href on navigation", () => {
    const router = createFakeRouter();
    const page = vi.fn();
    const flush = vi.fn();

    attachRouterPageTracking({ flush, page }, router);
    router.emit({ toLocation: { href: "/pricing?ref=x", pathname: "/pricing" } });

    expect(page).toHaveBeenCalledWith("/pricing", { href: "/pricing?ref=x" });
  });

  it("flushes right after tracking the page view", () => {
    const router = createFakeRouter();
    const page = vi.fn();
    const flush = vi.fn();

    attachRouterPageTracking({ flush, page }, router);
    router.emit({ toLocation: { href: "/pricing", pathname: "/pricing" } });

    expect(flush).toHaveBeenCalledTimes(1);
  });

  it("stops tracking once the returned unsubscribe function runs", () => {
    const router = createFakeRouter();
    const page = vi.fn();
    const flush = vi.fn();
    const unsubscribe = attachRouterPageTracking({ flush, page }, router);

    unsubscribe();
    router.emit({ toLocation: { href: "/a", pathname: "/a" } });

    expect(page).not.toHaveBeenCalled();
    expect(flush).not.toHaveBeenCalled();
  });
});
