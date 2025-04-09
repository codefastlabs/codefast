import { useEffect, useRef } from "react";

/**
 * Interface for the parameters of the useEvent hook.
 */
export interface UseEventParams<T extends Event> {
  /**
   * Name of the event to listen for (e.g., 'click', 'resize').
   */
  eventName: string;

  /**
   * Handler function to call when the event is triggered.
   * @param event - The event object passed from the listener.
   */
  handler: (event: T) => void;

  /**
   * Element to attach the event listener to.
   * Defaults to the global window object if not specified.
   */
  element?: EventTarget;
}

/**
 * Custom hook to manage event listeners with automatic cleanup.
 * Attaches an event listener to the specified element and removes it when the component unmounts.
 *
 * @param eventName - Name of the event to listen for.
 * @param handler - Handler function to call when the event is triggered.
 * @param element - Element to attach the event listener to (defaults to window).
 */
export function useEvent<T extends Event>(
  eventName: string,
  handler: (event: T) => void,
  element: EventTarget = window,
): void {
  /**
   * Ref to store the handler function to avoid unnecessary re-renders
   * when the handler function changes reference but not behavior.
   */
  const savedHandler = useRef<(event: T) => void>(null);

  /**
   * Update the ref.current value whenever the handler changes.
   * This ensures we always have the latest handler function.
   */
  useEffect(() => {
    savedHandler.current = handler;
  }, [handler]);

  /**
   * Set up and clean up the event listener.
   * Re-runs if the eventName or element changes.
   */
  useEffect(() => {
    /**
     * Event listener callback that uses the current handler from ref.
     * This maintains a stable reference while using the latest handler implementation.
     *
     * @param event - The event object from the listener.
     */
    const eventListener = (event: T): void => {
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
