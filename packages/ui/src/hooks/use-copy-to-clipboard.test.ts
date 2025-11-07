import { useCopyToClipboard } from "@/hooks/use-copy-to-clipboard";
import { act, renderHook } from "@testing-library/react";

describe("useCopyToClipboard", () => {
  const originalClipboard = globalThis.navigator.clipboard;
  let mockWriteText: jest.Mock;

  beforeEach(() => {
    mockWriteText = jest.fn().mockResolvedValue(async () => {
      /* noop */
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: mockWriteText,
      },
    });

    jest.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });

    jest.runOnlyPendingTimers();
    jest.useRealTimers();
    jest.clearAllMocks();
  });

  test("should initialize with isCopied as false", () => {
    const { result } = renderHook(() => useCopyToClipboard());

    expect(result.current.isCopied).toBe(false);
  });

  test("should copy text to clipboard and set isCopied to true", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(mockWriteText).toHaveBeenCalledWith("test text");
    expect(result.current.isCopied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.isCopied).toBe(false);
  });

  test("should call onCopy callback when copying is successful", async () => {
    const onCopy = jest.fn();
    const { result } = renderHook(() => useCopyToClipboard({ onCopy }));

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(onCopy).toHaveBeenCalledTimes(1);

    act(() => {
      jest.advanceTimersByTime(2000);
    });

    expect(result.current.isCopied).toBe(false);
  });

  test("should reset isCopied after the timeout period", async () => {
    const { result } = renderHook(() => useCopyToClipboard({ timeout: 1000 }));

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(result.current.isCopied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(result.current.isCopied).toBe(false);
  });

  test("should not copy if value is empty", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("");
    });

    expect(mockWriteText).not.toHaveBeenCalled();
    expect(result.current.isCopied).toBe(false);
  });

  test("should handle errors when copying fails", async () => {
    const consoleErrorSpy = jest.spyOn(console, "error").mockImplementation();

    mockWriteText.mockRejectedValue(new Error("Clipboard error"));

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(consoleErrorSpy).toHaveBeenCalledWith(expect.any(Error));
    expect(result.current.isCopied).toBe(false);

    consoleErrorSpy.mockRestore();
  });

  test("should use default timeout value if not provided", async () => {
    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(result.current.isCopied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(1900);
    });
    expect(result.current.isCopied).toBe(true);

    act(() => {
      jest.advanceTimersByTime(200);
    });
    expect(result.current.isCopied).toBe(false);
  });

  test("should handle environment without clipboard API", async () => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText: undefined },
    });

    const { result } = renderHook(() => useCopyToClipboard());

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(result.current.isCopied).toBe(false);
  });
});
