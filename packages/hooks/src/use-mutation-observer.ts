import * as React from 'react';

/**
 * Attaches a MutationObserver to a given HTMLElement and invokes a callback function when mutations occur in the
 * observed elements.
 *
 * @param ref - The mutable reference to the HTMLElement to be observed for mutations.
 * @param callback - The callback function to be invoked when mutations occur.
 * @param options - The options object to configure the mutation observer. Defaults to observing attribute, character
 *   data, child list changes, and subtree changes.
 * @returns void
 *
 * @remarks
 * This function is a React hook that attaches a MutationObserver to a given HTMLElement. The MutationObserver listens
 *   for mutations in the observed element and its descendants and invokes the provided callback function when
 *   mutations occur.
 *
 * @see [MutationObserver](https://developer.mozilla.org/en-US/docs/Web/API/MutationObserver)
 */
export function useMutationObserver(
  ref: React.MutableRefObject<HTMLElement | null>,
  callback: MutationCallback,
  options: MutationObserverInit = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  },
): void {
  React.useEffect(() => {
    if (!ref.current) {
      return;
    }

    const observer = new MutationObserver(callback);

    observer.observe(ref.current, options);

    return () => {
      observer.disconnect();
    };
  }, [ref, callback, options]);
}
