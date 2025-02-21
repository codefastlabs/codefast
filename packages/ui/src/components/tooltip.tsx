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
          'data-[state=delayed-open]:animate-motion-in data-[state=delayed-open]:motion-fade-in-0 data-[state=delayed-open]:motion-zoom-in-95',
          'data-[state=delayed-open]:data-[side=top]:motion-slide-in-b-2',
          'data-[state=delayed-open]:data-[side=right]:motion-slide-in-l-2',
          'data-[state=delayed-open]:data-[side=bottom]:motion-slide-in-t-2',
          'data-[state=delayed-open]:data-[side=left]:motion-slide-in-r-2',
          'data-[state=closed]:animate-motion-out data-[state=closed]:motion-fade-out-0 data-[state=closed]:motion-zoom-out-95',
          'data-[state=closed]:data-[side=top]:motion-slide-out-b-2',
          'data-[state=closed]:data-[side=right]:motion-slide-out-l-2',
          'data-[state=closed]:data-[side=bottom]:motion-slide-out-t-2',
          'data-[state=closed]:data-[side=left]:motion-slide-out-r-2',
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
