import { useCallback, useEffect, useRef, useState } from "react";

/**
 * The current toast message and the callback that shows a new one.
 *
 * @since 0.3.16-canary.3
 */
export interface ToastHandle {
  toastMsg: string | null;
  showToast: (message: string) => void;
}

const TOAST_DURATION_MS = 3500;

/**
 * Manages a single auto-dismissing toast message and returns it with its show callback.
 *
 * @since 0.3.16-canary.3
 */
export function useToast(): ToastHandle {
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((message: string) => {
    setToastMsg(message);
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    timerRef.current = setTimeout(() => setToastMsg(null), TOAST_DURATION_MS);
  }, []);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  return { toastMsg, showToast };
}
