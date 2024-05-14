import * as React from 'react';

export const useMutationObserver = (
  ref: React.MutableRefObject<HTMLElement | null>,
  callback: MutationCallback,
  options: MutationObserverInit = {
    attributes: true,
    characterData: true,
    childList: true,
    subtree: true,
  },
): void => {
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
};
