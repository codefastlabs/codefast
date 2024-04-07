"use client";

import * as React from "react";
import { composeEventHandlers } from "@radix-ui/primitive";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Radio
 * -------------------------------------------------------------------------- */

type RadioElement = HTMLInputElement;

interface RadioProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onValueChange?: (value: string) => void;
}

const Radio = React.forwardRef<RadioElement, RadioProps>(({ className, onValueChange, onChange, ...props }, ref) => {
  return (
    <input
      ref={ref}
      type="radio"
      onChange={composeEventHandlers(onChange, (event) => onValueChange?.(event.currentTarget.value))}
      className={cn(
        "peer relative flex appearance-none items-center justify-center rounded-full",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "before:border-compound/70 before:size-4 before:rounded-full before:border",
        "hover:before:border-compound",
        "checked:before:border-primary",
        "checked:after:bg-primary checked:after:absolute checked:after:size-2.5 checked:after:rounded-full",
        "focus-visible:ring-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2",
        className,
      )}
      {...props}
    />
  );
});

Radio.displayName = "Radio";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Radio };
