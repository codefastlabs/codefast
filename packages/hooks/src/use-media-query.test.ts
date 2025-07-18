import { useMediaQuery } from "@/use-media-query";
import { act, renderHook } from "@testing-library/react";

type ChangeHandler = (event: MediaQueryListEvent) => void;

const setupMockMatchMedia = (
  matches: boolean,
): {
  mockAddEventListener: jest.Mock;
  mockMediaQueryList: {
    addEventListener: jest.Mock;
    matches: boolean;
    media: string;
    onchange: null;
    removeEventListener: jest.Mock;
    addListener: jest.Mock;
    removeListener: jest.Mock;
    dispatchEvent: jest.Mock;
  };
  mockRemoveEventListener: jest.Mock;
} => {
  const mockAddEventListener = jest.fn();
  const mockRemoveEventListener = jest.fn();
  const mockAddListener = jest.fn();
  const mockRemoveListener = jest.fn();
  const mockDispatchEvent = jest.fn();

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

  // Ensure matchMedia exists on globalThis for the test environment
  Object.defineProperty(globalThis, "matchMedia", {
    value: jest.fn().mockImplementation(() => mockMediaQueryList),
    writable: true,
  });

  return { mockAddEventListener, mockMediaQueryList, mockRemoveEventListener };
};

describe("useMediaQuery", () => {
  test("should return true when media query matches", () => {
    const { mockMediaQueryList } = setupMockMatchMedia(true);

    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));

    expect(result.current).toBe(true);
    expect(globalThis.matchMedia).toHaveBeenCalledWith("(min-width: 600px)");
    expect(mockMediaQueryList.addEventListener).toHaveBeenCalledWith(
      "change",
      expect.any(Function),
    );
  });

  test("should return false when media query does not match", () => {
    setupMockMatchMedia(false);

    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));

    expect(result.current).toBe(false);
    expect(globalThis.matchMedia).toHaveBeenCalledWith("(min-width: 600px)");
  });

  test("should update when media query changes", () => {
    const { mockAddEventListener, mockMediaQueryList } = setupMockMatchMedia(false);
    const { result } = renderHook(() => useMediaQuery("(min-width: 600px)"));

    expect(result.current).toBe(false);

    act(() => {
      // Use an explicit type cast to ensure the correctness of the changeHandler type
      const calls = mockAddEventListener.mock.calls as [string, ChangeHandler][];
      const changeHandler = calls[0]?.[1];

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
    expect(globalThis.matchMedia).toHaveBeenCalledWith("(min-width: 800px)");
  });
});
