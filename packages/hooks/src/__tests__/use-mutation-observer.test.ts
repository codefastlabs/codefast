import { useMutationObserver } from "@/use-mutation-observer";
import { renderHook } from "@testing-library/react";

describe("useMutationObserver", () => {
  test("should attach a MutationObserver and call the callback on mutations", () => {
    const callback = jest.fn();
    const ref = { current: document.createElement("div") };

    ref.current.innerHTML = "<div></div>";

    renderHook(() => {
      useMutationObserver(ref, callback);
    });

    // Simulate a DOM mutation
    const newElement = document.createElement("span");

    ref.current.append(newElement);

    // MutationObserver callbacks are asynchronous
    setTimeout(() => {
      // Assert that the callback was called
      expect(callback).toHaveBeenCalledWith(expect.any(Array), expect.any(MutationObserver));
    }, 0);
  });

  test("should clean up the MutationObserver on unmount", () => {
    const callback = jest.fn();
    const ref = { current: document.createElement("div") };

    const { unmount } = renderHook(() => {
      useMutationObserver(ref, callback);
    });

    const disconnectSpy = jest.spyOn(MutationObserver.prototype, "disconnect");

    unmount();

    // Assert that disconnect was called
    expect(disconnectSpy).toHaveBeenCalledWith();
  });
});
