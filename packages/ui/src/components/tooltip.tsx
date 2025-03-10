import type { ComponentProps, JSX } from 'react';

import * as TooltipPrimitive from '@radix-ui/react-tooltip';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: TooltipProvider
 * -------------------------------------------------------------------------- */

function TooltipProvider({ ...props }: ComponentProps<typeof TooltipPrimitive.Provider>): JSX.Element {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: Tooltip
 * -------------------------------------------------------------------------- */

function Tooltip({ ...props }: ComponentProps<typeof TooltipPrimitive.Root>): JSX.Element {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TooltipTrigger
 * -------------------------------------------------------------------------- */

function TooltipTrigger({ ...props }: ComponentProps<typeof TooltipPrimitive.Trigger>): JSX.Element {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TooltipContent
 * -------------------------------------------------------------------------- */

function TooltipContent({
  className,
  sideOffset = 8,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>): JSX.Element {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          'bg-popover text-popover-foreground data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:data-[side=right]:slide-in-from-left-2 data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-2 data-[state=delayed-open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 z-50 rounded-lg border px-3 py-1.5 text-xs shadow-lg',
          className,
        )}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TooltipArrow
 * -------------------------------------------------------------------------- */

function TooltipArrow({ className, ...props }: ComponentProps<typeof TooltipPrimitive.Arrow>): JSX.Element {
  return <TooltipPrimitive.Arrow className={cn('fill-popover', className)} data-slot="tooltip-arrow" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger };
