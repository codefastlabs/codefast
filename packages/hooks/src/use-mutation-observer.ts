import type { RefObject } from "react";

import { useEffect } from "react";

/**
 * Default options for the MutationObserver.
 * Configures the observer to watch for all types of mutations.
 */
const defaultOptions: MutationObserverInit = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
};

/**
 * Attaches a MutationObserver to a given HTMLElement and invokes a callback
 * function when mutations occur in the observed elements.
 *
 * @param ref - The mutable reference to the HTMLElement to be observed for mutations
 * @param callback - The function to be called when mutations are detected
 * @param options - Configuration options for the MutationObserver, defaults to watching all changes
 * @returns void
 *
 * @remarks
 * This function is a React hook that attaches a MutationObserver to a given
 * HTMLElement. The MutationObserver listens for mutations in the observed
 * element and its descendants and invokes the provided callback function
 * when mutations occur.
 *
 * @see [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
 */
export function useMutationObserver(
  ref: RefObject<HTMLElement | null>,
  callback: MutationCallback,
  options: MutationObserverInit = defaultOptions,
): void {
  useEffect(() => {
    /**
     * If the reference is null, we can't attach an observer
     */
    if (!ref.current) {
      return;
    }

    /**
     * Create a new MutationObserver with the provided callback
     */
    const observer = new MutationObserver(callback);

    /**
     * Start observing the target element with the specified options
     */
    observer.observe(ref.current, options);

    /**
     * Cleanup function to disconnect the observer when the component unmounts
     * or when dependencies change
     */
    return () => {
      observer.disconnect();
    };
  }, [ref, callback, options]);
}
