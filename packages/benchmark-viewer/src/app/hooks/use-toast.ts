import { useCallback, useEffect, useRef, useState } from "react";

export interface ToastHandle {
  toastMsg: string | null;
  showToast: (message: string) => void;
}

const TOAST_DURATION_MS = 3500;

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
