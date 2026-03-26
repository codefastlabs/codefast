"use client";

import type { RefObject } from "react";

import { useEffect } from "react";

/**
 * Default options for MutationObserver observing common mutation types.
 */
const defaultOptions: MutationObserverInit = {
  attributes: true,
  characterData: true,
  childList: true,
  subtree: true,
};

/**
 * Observe DOM mutations on a referenced element and invoke a callback.
 *
 * Attaches a MutationObserver to the provided element reference with the given
 * options and calls the callback whenever mutations occur.
 *
 * @param ref - Ref to the target HTMLElement to observe.
 * @param callback - Mutation callback invoked with observed records.
 * @param options - Observer configuration. Defaults watch attributes, characterData, childList, subtree.
 * @returns void
 *
 * @see [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
 */
export function useMutationObserver(
  ref: RefObject<HTMLElement | null>,
  callback: MutationCallback,
  options: MutationObserverInit = defaultOptions,
): void {
  useEffect(() => {
    // Abort if ref is not attached
    if (!ref.current) {
      return;
    }

    // Create observer
    const observer = new MutationObserver(callback);

    // Observe with provided options
    observer.observe(ref.current, options);

    // Cleanup on unmount or when deps change
    return (): void => {
      observer.disconnect();
    };
  }, [ref, callback, options]);
}
