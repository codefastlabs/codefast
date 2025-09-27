"use client";

import type { ComponentProps, CSSProperties, ReactNode } from "react";

import { cn } from "@codefast/tailwind-variants";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";

/* -----------------------------------------------------------------------------
 * Component: Spinner
 * -------------------------------------------------------------------------- */

const SPINNER_COUNT = 8;

interface SpinnerProps extends ComponentProps<"span"> {
  loading?: boolean;
}

function Spinner({ children, className, loading = true, ...props }: SpinnerProps): ReactNode {
  if (!loading) {
    return children;
  }

  const spinner = (
    <span
      className={cn("relative flex size-4 items-center justify-center opacity-60", className)}
      {...props}
    >
      {Array.from({ length: SPINNER_COUNT }, (_, index) => (
        <span
          key={index}
          className={cn(
            "rotate-(--spinner-rotate) before:animate-out before:fade-out-25 before:repeat-infinite before:delay-(--spinner-delay) before:animation-duration-(--spinner-duration) absolute h-full before:block before:h-1/3 before:w-full before:rounded-full before:bg-current",
          )}
          style={
            {
              "--spinner-delay": `-${((SPINNER_COUNT - index) * 100).toString()}ms`,
              "--spinner-duration": `${(SPINNER_COUNT * 100).toString()}ms`,
              "--spinner-rotate": `${((360 / SPINNER_COUNT) * index).toString()}deg`,
              width: `${(100 / SPINNER_COUNT).toString()}%`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );

  if (children === undefined) {
    return spinner;
  }

  return (
    <span className="relative">
      <span aria-hidden className="invisible contents">
        {children}
      </span>
      <VisuallyHidden>{children}</VisuallyHidden>
      <span className="absolute inset-0 flex items-center justify-center">{spinner}</span>
    </span>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Spinner };
export type { SpinnerProps };
