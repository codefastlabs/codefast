import { Button } from "@codefast/ui/button";
import type { ComponentProps, ReactElement } from "react";
import { useEffect, useRef, useState } from "react";

interface CopyButtonProps extends Omit<ComponentProps<typeof Button>, "children"> {
  value: string;
}

/** Copies `value` to the clipboard and confirms it on the label until the moment passes. */
export function CopyButton({ value, size = "sm", variant = "outline", ...props }: CopyButtonProps): ReactElement {
  const [copied, setCopied] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    return () => {
      clearTimeout(timerRef.current);
    };
  }, []);

  return (
    <Button
      size={size}
      variant={variant}
      {...props}
      // Owned by this component: copying is what the button is for.
      onClick={(event) => {
        props.onClick?.(event);
        void navigator.clipboard.writeText(value).then(() => {
          setCopied(true);
          clearTimeout(timerRef.current);
          timerRef.current = setTimeout(() => {
            setCopied(false);
          }, 1500);
        });
      }}
    >
      {copied ? "Copied ✓" : "Copy"}
    </Button>
  );
}
