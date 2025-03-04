import type { ComponentProps, JSX } from 'react';
import type { VariantProps } from 'tailwind-variants';

import { tv } from 'tailwind-variants';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Variant: Alert
 * -------------------------------------------------------------------------- */

const alertVariants = tv({
  base: 'relative grid w-full grid-cols-[0_1fr] items-start gap-y-0.5 rounded-lg border px-4 py-3 text-sm has-[>svg]:grid-cols-[--spacing(4)_1fr] has-[>svg]:gap-x-3 [&>svg]:size-4 [&>svg]:translate-y-0.5 [&>svg]:text-current',
  variants: {
    variant: {
      default: 'bg-background text-foreground',
      destructive: 'text-destructive *:data-[slot=alert-description]:text-destructive/80 [&>svg]:text-current',
    },
  },
  defaultVariants: {
    variant: 'default',
  },
});

type AlertVariantsProps = VariantProps<typeof alertVariants>;

/* -----------------------------------------------------------------------------
 * Component: Alert
 * -------------------------------------------------------------------------- */

type AlertProps = AlertVariantsProps & ComponentProps<'div'>;

function Alert({ className, variant, ...props }: AlertProps): JSX.Element {
  return <div className={alertVariants({ className, variant })} data-slot="alert" role="alert" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AlertTitle
 * -------------------------------------------------------------------------- */

type AlertTitleProps = ComponentProps<'div'>;

function AlertTitle({ children, className, ...props }: AlertTitleProps): JSX.Element {
  return (
    <div
      className={cn('col-start-2 line-clamp-1 min-h-4 font-medium tracking-tight', className)}
      data-slot="alert-title"
      {...props}
    >
      {children}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: AlertDescription
 * -------------------------------------------------------------------------- */

type AlertDescriptionProps = ComponentProps<'div'>;

function AlertDescription({ className, ...props }: AlertDescriptionProps): JSX.Element {
  return (
    <div
      className={cn(
        'text-muted-foreground col-start-2 grid justify-items-start gap-1 text-sm [&_p]:leading-relaxed',
        className,
      )}
      data-slot="alert-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { AlertDescriptionProps, AlertProps, AlertTitleProps };
export { Alert, AlertDescription, AlertTitle };
