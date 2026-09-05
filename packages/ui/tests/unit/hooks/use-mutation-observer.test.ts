import { renderHook } from "@testing-library/react";

import { useMutationObserver } from "#/hooks/use-mutation-observer";

describe("useMutationObserver", () => {
  test("should attach a MutationObserver and call the callback on mutations", async () => {
    const callback = vi.fn();
    const ref = { current: document.createElement("div") };

    ref.current.innerHTML = "<div></div>";

    renderHook(() => {
      useMutationObserver(ref, callback);
    });

    // Simulate a DOM mutation
    const newElement = document.createElement("span");

    ref.current.append(newElement);

    // MutationObserver delivers records asynchronously; the test must own the wait
    await vi.waitFor(() => {
      expect(callback).toHaveBeenCalledWith(expect.any(Array), expect.any(MutationObserver));
    });
  });

  test("should clean up the MutationObserver on unmount", () => {
    const callback = vi.fn();
    const ref = { current: document.createElement("div") };

    const { unmount } = renderHook(() => {
      useMutationObserver(ref, callback);
    });

    const disconnectSpy = vi.spyOn(MutationObserver.prototype, "disconnect");

    unmount();

    // Assert that disconnect was called
    expect(disconnectSpy).toHaveBeenCalledWith();
  });
});
