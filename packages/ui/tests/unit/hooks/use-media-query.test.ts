import { act, renderHook } from "@testing-library/react";
import type { Mock } from "vitest";

import { useMediaQuery } from "#/hooks/use-media-query";

type ChangeHandler = (event: MediaQueryListEvent) => void;

const setupMockMatchMedia = (
  matches: boolean,
): {
  mockAddEventListener: Mock;
  mockMediaQueryList: {
    addEventListener: Mock;
    matches: boolean;
    media: string;
    onchange: null;
    removeEventListener: Mock;
    addListener: Mock;
    removeListener: Mock;
    dispatchEvent: Mock;
  };
  mockRemoveEventListener: Mock;
} => {
  const mockAddEventListener = vi.fn();
  const mockRemoveEventListener = vi.fn();
  const mockAddListener = vi.fn();
  const mockRemoveListener = vi.fn();
  const mockDispatchEvent = vi.fn();

  const mockMediaQueryList = {
    addEventListener: mockAddEventListener,
    addListener: mockAddListener,
    dispatchEvent: mockDispatchEvent,
    matches,
    media: "",
    onchange: null,
    removeEventListener: mockRemoveEventListener,
    removeListener: mockRemoveListener,
  };

  // Ensure matchMedia exists on window for the test environment
  Object.defineProperty(window, "matchMedia", {
    value: vi.fn().mockImplementation(() => mockMediaQueryList),
    writable: true,
  });

  return { mockAddEventListener, mockMediaQueryList, mockRemoveEventListener };
};

describe("useMediaQuery", () => {
  test("should return true when media query matches", () => {
    const { mockMediaQueryList } = setupMockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));

    expect(result.current).toBe(true);
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 600px)");
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  test("should return false when media query does not match", () => {
    setupMockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));

    expect(result.current).toBe(false);
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 600px)");
  });

  test("should update when media query changes", () => {
    const { mockAddEventListener, mockMediaQueryList } = setupMockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));

    expect(result.current).toBe(false);

    act(() => {
      // Use an explicit type cast to ensure the correctness of the changeHandler type
      const calls = mockAddEventListener.mock.calls as Array<[string, ChangeHandler]>;
      const changeHandler = calls[0]?.[1];
      if (changeHandler === undefined) {
        throw new Error("expected change handler");
      }

      mockMediaQueryList.matches = true;
      changeHandler({ matches: true } as MediaQueryListEvent);
    });

    expect(result.current).toBe(true);
  });

  test("should clean up event listener on unmount", () => {
    const { mockMediaQueryList, mockRemoveEventListener } = setupMockMatchMedia(true);

    const { unmount } = renderHook(() => useMediaQuery("(min-width: 600px)"));

    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );

    unmount();
    expect(mockRemoveEventListener).toHaveBeenCalledWith("change", expect.any(Function));
  });

  test("should re-add listener when query changes", () => {
    const { mockAddEventListener, mockRemoveEventListener } = setupMockMatchMedia(false);

    const { rerender } = renderHook((query) => useMediaQuery(query), {
      initialProps: "(min-width: 600px)",
    });

    expect(mockAddEventListener).toHaveBeenCalledWith("change", expect.any(Function));

    rerender("(min-width: 800px)");
    expect(mockRemoveEventListener).toHaveBeenCalledWith("change", expect.any(Function));
    expect(window.matchMedia).toHaveBeenCalledWith("(min-width: 800px)");
  });
});
