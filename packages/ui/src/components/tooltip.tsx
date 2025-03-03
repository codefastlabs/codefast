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
          'bg-popover text-popover-foreground ring-border data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=delayed-open]:data-[side=top]:slide-from-b-2 data-[state=delayed-open]:data-[side=right]:slide-from-l-2 data-[state=delayed-open]:data-[side=bottom]:slide-from-t-2 data-[state=delayed-open]:data-[side=left]:slide-from-r-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-to-b-2 data-[state=closed]:data-[side=right]:slide-to-l-2 data-[state=closed]:data-[side=bottom]:slide-to-t-2 data-[state=closed]:data-[side=left]:slide-to-r-2 z-50 rounded-lg px-3 py-1.5 text-xs shadow-lg ring',
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

export type { TooltipArrowProps, TooltipContentProps, TooltipProps, TooltipProviderProps, TooltipTriggerProps };
export { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger };
