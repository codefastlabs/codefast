import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { type CSSProperties, type HTMLAttributes, forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Spinner
 * -------------------------------------------------------------------------- */

const spinnerCount = 8;

type SpinnerElement = HTMLSpanElement;
interface SpinnerProps extends HTMLAttributes<HTMLSpanElement> {
  loading?: boolean;
}

const Spinner = forwardRef<SpinnerElement, SpinnerProps>(
  ({ children, className, loading = true, ...props }, forwardedRef) => {
    if (!loading) {
      return children;
    }

    const spinner = (
      <span
        ref={forwardedRef}
        className={cn('relative flex size-4 items-center justify-center opacity-60', className)}
        {...props}
      >
        {Array.from({ length: spinnerCount }, (_, i) => (
          <span
            key={i}
            className="before:fade-out-25 before:animate-out before:animate-repeat-infinite before:animate-delay-[var(--spinner-delay)] before:animate-duration-[var(--spinner-duration)] absolute h-full rotate-[var(--spinner-rotate)] before:block before:h-1/3 before:w-full before:rounded-full before:bg-current"
            style={
              {
                '--spinner-delay': `-${((spinnerCount - i) * 100).toString()}ms`,
                '--spinner-duration': `${(spinnerCount * 100).toString()}ms`,
                '--spinner-rotate': `${((360 / spinnerCount) * i).toString()}deg`,
                width: `${(100 / spinnerCount).toString()}%`,
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
  },
);

Spinner.displayName = 'Spinner';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Spinner, type SpinnerProps };
