import * as React from "react";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Spinner
 * -------------------------------------------------------------------------- */

const spinnerCount = 8;

type SpinnerElement = HTMLSpanElement;

interface SpinnerProps extends React.HTMLAttributes<HTMLSpanElement> {
  loading?: boolean;
}

const Spinner = React.forwardRef<SpinnerElement, SpinnerProps>(
  ({ className, loading = true, children, ...props }, ref) => {
    if (!loading) {
      return children;
    }

    const spinner = (
      <span
        ref={ref}
        className={cn("relative flex size-4 items-center justify-center opacity-60", className)}
        {...props}
      >
        {Array.from({ length: spinnerCount }, (_, i) => (
          <span
            key={i}
            className={cn(
              "absolute h-full rotate-[var(--spinner-rotate)]",
              "before:fade-out-25 before:animate-out before:repeat-infinite before:block before:h-1/3 before:w-full before:rounded-full before:bg-current before:[animation-delay:var(--spinner-delay)] before:[animation-duration:var(--spinner-duration)]",
            )}
            style={
              {
                width: `${(100 / spinnerCount).toString()}%`,
                "--spinner-delay": `-${((spinnerCount - i) * 100).toString()}ms`,
                "--spinner-rotate": `${((360 / spinnerCount) * i).toString()}deg`,
                "--spinner-duration": `${(spinnerCount * 100).toString()}ms`,
              } as React.CSSProperties
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
        <span
          aria-hidden
          className="invisible contents"
          // Workaround to use `inert` until https://github.com/facebook/react/pull/24730 is merged.
          {...{ inert: "" }}
        >
          {children}
        </span>

        <span className="absolute inset-0 flex items-center justify-center">{spinner}</span>
      </span>
    );
  },
);

Spinner.displayName = "Spinner";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Spinner, type SpinnerProps };
