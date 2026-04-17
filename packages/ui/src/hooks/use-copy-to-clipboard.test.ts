import { act, renderHook } from "@testing-library/react";
import type { Mock } from "vitest";

import { useCopyToClipboard } from "#/hooks/use-copy-to-clipboard";

describe("useCopyToClipboard", () => {
  const originalClipboard = window.navigator.clipboard;
  let mockWriteText: Mock<(data: string) => Promise<void>>;

  beforeEach(() => {
    mockWriteText = vi.fn<(data: string) => Promise<void>>().mockResolvedValue(undefined);
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: {
        writeText: mockWriteText,
      } as unknown as Clipboard,
    });

    vi.useFakeTimers();
  });

  afterEach(() => {
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: originalClipboard,
    });

    vi.runOnlyPendingTimers();
    vi.useRealTimers();
    vi.clearAllMocks();
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
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.isCopied).toBe(false);
  });

  test("should call onCopy callback when copying is successful", async () => {
    const onCopy = vi.fn<(...args: unknown[]) => unknown>();
    const { result } = renderHook(() => useCopyToClipboard({ onCopy }));

    await act(async () => {
      await result.current.copyToClipboard("test text");
    });

    expect(onCopy).toHaveBeenCalledTimes(1);

    act(() => {
      vi.advanceTimersByTime(2000);
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
      vi.advanceTimersByTime(1000);
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
    const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => undefined);

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
      vi.advanceTimersByTime(1900);
    });
    expect(result.current.isCopied).toBe(true);

    act(() => {
      vi.advanceTimersByTime(200);
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
