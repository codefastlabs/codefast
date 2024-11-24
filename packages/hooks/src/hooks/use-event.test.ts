import { renderHook } from '@testing-library/react';

import { useEvent } from '@/hooks/use-event';

describe('useEvent', () => {
  it('should attach an event listener to the provided element', () => {
    const element = document.createElement('div');
    const handler = vi.fn();
    const eventName = 'click';

    renderHook(() => {
      useEvent(eventName, handler, element);
    });

    const event = new MouseEvent('click');

    element.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should use window as default element', () => {
    const handler = vi.fn();
    const eventName = 'resize';

    renderHook(() => {
      useEvent(eventName, handler);
    });

    const event = new Event('resize');

    window.dispatchEvent(event);

    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(event);
  });

  it('should clean up event listener on unmount', () => {
    const element = document.createElement('div');
    const handler = vi.fn();
    const eventName = 'click';

    const { unmount } = renderHook(() => {
      useEvent(eventName, handler, element);
    });

    unmount();

    const event = new MouseEvent('click');

    element.dispatchEvent(event);

    expect(handler).not.toHaveBeenCalled();
  });

  it('should update handler when it changes', () => {
    const element = document.createElement('div');
    const initialHandler = vi.fn();
    const updatedHandler = vi.fn();
    const eventName = 'click';

    const { rerender } = renderHook(
      ({ handler }) => {
        useEvent(eventName, handler, element);
      },
      {
        initialProps: { handler: initialHandler },
      },
    );

    rerender({ handler: updatedHandler });

    const event = new MouseEvent('click');

    element.dispatchEvent(event);

    expect(initialHandler).not.toHaveBeenCalled();
    expect(updatedHandler).toHaveBeenCalledTimes(1);
  });

  it('should update event listener when event name changes', () => {
    const element = document.createElement('div');
    const handler = vi.fn();
    const initialEventName = 'click';
    const updatedEventName = 'mouseover';

    const { rerender } = renderHook(
      ({ eventName }) => {
        useEvent(eventName, handler, element);
      },
      {
        initialProps: { eventName: initialEventName },
      },
    );

    rerender({ eventName: updatedEventName });

    let event = new MouseEvent('click');

    element.dispatchEvent(event);
    expect(handler).not.toHaveBeenCalled();

    event = new MouseEvent('mouseover');
    element.dispatchEvent(event);
    expect(handler).toHaveBeenCalledTimes(1);
  });
});
