import { Button } from "@codefast/ui/button";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

interface CopyButtonProps {
  value: string;
}

/** Copies `value` to the clipboard with a transient "Copied" confirmation. */
export function CopyButton({ value }: CopyButtonProps): ReactElement {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Button
      onClick={() => {
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setCopied(false);
          }, 1500);
        });
      }}
      size="sm"
      variant="outline"
    >
      {copied ? "Copied ✓" : "Copy"}
    </Button>
  );
}
