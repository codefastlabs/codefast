import { renderHook } from "@testing-library/react";

import { useEvent } from "@/use-event";

describe("useEvent", () => {
  test("should attach an event listener to the provided element", () => {
    const element = document.createElement("div");
    const handler = jest.fn();
    const eventName = "click";

    renderHook(() => {
      useEvent(eventName, handler, element);
    });

    const event = new MouseEvent("click");

    element.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  test("should use window as default element", () => {
    const handler = jest.fn(); // Sử dụng jest.fn() thay vì vi.fn()
    const eventName = "resize";

    renderHook(() => {
      useEvent(eventName, handler);
    });

    const event = new Event("resize");

    globalThis.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  test("should clean up event listener on unmount", () => {
    const element = document.createElement("div");
    const handler = jest.fn(); // Sử dụng jest.fn() thay vì vi.fn()
    const eventName = "click";

    const { unmount } = renderHook(() => {
      useEvent(eventName, handler, element);
    });

    unmount();

    const event = new MouseEvent("click");

    element.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  test("should update handler when it changes", () => {
    const element = document.createElement("div");
    const initialHandler = jest.fn(); // Sử dụng jest.fn() thay vì vi.fn()
    const updatedHandler = jest.fn(); // Sử dụng jest.fn() thay vì vi.fn()
    const eventName = "click";

    const { rerender } = renderHook(
      ({ handler }) => {
        useEvent(eventName, handler, element);
      },
      {
        initialProps: { handler: initialHandler },
      },
    );

    rerender({ handler: updatedHandler });

    const event = new MouseEvent("click");

    element.dispatchEvent(event);

    expect(initialHandler).not.toHaveBeenCalled();
    expect(updatedHandler).toHaveBeenCalledTimes(1);
  });

  test("should update event listener when event name changes", () => {
    const element = document.createElement("div");
    const handler = jest.fn(); // Sử dụng jest.fn() thay vì vi.fn()
    const initialEventName = "click";
    const updatedEventName = "mouseover";

    const { rerender } = renderHook(
      ({ eventName }) => {
        useEvent(eventName, handler, element);
      },
      {
        initialProps: { eventName: initialEventName },
      },
    );

    rerender({ eventName: updatedEventName });

    let event = new MouseEvent("click");

    element.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    event = new MouseEvent("mouseover");
    element.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
