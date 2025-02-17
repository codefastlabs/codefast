import type { ComponentProps, JSX } from 'react';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: TooltipProvider
 * -------------------------------------------------------------------------- */

type TooltipProviderProps = ComponentProps<typeof TooltipPrimitive.Provider>;
const TooltipProvider = TooltipPrimitive.Provider;

/* -----------------------------------------------------------------------------
 * Component: Tooltip
 * -------------------------------------------------------------------------- */

type TooltipProps = ComponentProps<typeof TooltipPrimitive.Root>;
const Tooltip = TooltipPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: TooltipTrigger
 * -------------------------------------------------------------------------- */

type TooltipTriggerProps = ComponentProps<typeof TooltipPrimitive.Trigger>;
const TooltipTrigger = TooltipPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: TooltipContent
 * -------------------------------------------------------------------------- */

type TooltipContentProps = ComponentProps<typeof TooltipPrimitive.Content>;

function TooltipContent({ className, sideOffset = 6, ...props }: TooltipContentProps): JSX.Element {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          'bg-popover text-popover-foreground',
          'z-50 rounded-md border px-3 py-1.5 text-xs',
          'data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in data-[state=delayed-open]:zoom-in-95',
          'data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-2',
          'data-[state=delayed-open]:data-[side=right]:slide-in-from-left-2',
          'data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-2',
          'data-[state=delayed-open]:data-[side=left]:slide-in-from-right-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
          'data-[state=closed]:data-[side=top]:slide-out-to-bottom-2',
          'data-[state=closed]:data-[side=right]:slide-out-to-left-2',
          'data-[state=closed]:data-[side=bottom]:slide-out-to-top-2',
          'data-[state=closed]:data-[side=left]:slide-out-to-right-2',
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TooltipArrow
 * -------------------------------------------------------------------------- */

type TooltipArrowProps = ComponentProps<typeof TooltipPrimitive.Arrow>;

function TooltipArrow({ className, ...props }: TooltipArrowProps): JSX.Element {
  return <TooltipPrimitive.Arrow className={cn('fill-popover', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  TooltipArrowProps,
  TooltipContentProps,
  TooltipProps,
  TooltipProviderProps,
  TooltipTriggerProps,
};
export { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger };
