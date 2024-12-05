import { useEffect, useRef } from 'react';

/**
 * Custom hook to manage event listeners.
 *
 * @param eventName - Name of the event to listen for.
 * @param handler - Handler function to call when the event is triggered.
 * @param element - Element to attach the event listener to (default is a
 *   window).
 */
export function useEvent(eventName: string, handler: (event: Event) => void, element: EventTarget = window): void {
  // Create a ref that stores handler
  const savedHandler = useRef<(event: Event) => void>(null);

  // Update ref.current value if handler changes.
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  useEffect(() => {
    const eventListener = (event: Event): void => {
      if (savedHandler.current) {
        savedHandler.current(event);
      }
    };

    // Attach event listener
    element.addEventListener(eventName, eventListener as EventListener);

    // Clean up event listener on unmounting or if dependencies change
    return () => {
      element.removeEventListener(eventName, eventListener as EventListener);
    };
  }, [eventName, element]); // Re-run if eventName or element changes
}
