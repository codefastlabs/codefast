'use client';

import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/tailwind-variants';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';

/* -----------------------------------------------------------------------------
 * Component: TooltipProvider
 * -------------------------------------------------------------------------- */

type TooltipProviderProps = ComponentProps<typeof TooltipPrimitive.Provider>;

function TooltipProvider({ ...props }: TooltipProviderProps): JSX.Element {
  return <TooltipPrimitive.Provider data-slot="tooltip-provider" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: Tooltip
 * -------------------------------------------------------------------------- */

type TooltipProps = ComponentProps<typeof TooltipPrimitive.Root>;

function Tooltip({ ...props }: TooltipProps): JSX.Element {
  return <TooltipPrimitive.Root data-slot="tooltip" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TooltipTrigger
 * -------------------------------------------------------------------------- */

type TooltipTriggerProps = ComponentProps<typeof TooltipPrimitive.Trigger>;

function TooltipTrigger({ ...props }: TooltipTriggerProps): JSX.Element {
  return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: TooltipContent
 * -------------------------------------------------------------------------- */

type TooltipContentProps = ComponentProps<typeof TooltipPrimitive.Content>;

function TooltipContent({ children, className, sideOffset = 4, ...props }: TooltipContentProps): JSX.Element {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          'bg-primary text-primary-foreground data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95 data-[state=delayed-open]:data-[side=top]:slide-in-from-bottom-2 data-[state=delayed-open]:data-[side=right]:slide-in-from-left-2 data-[state=delayed-open]:data-[side=bottom]:slide-in-from-top-2 data-[state=delayed-open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 ease-ui z-50 rounded-md px-3 py-1.5 text-xs',
          'max-w-(--radix-tooltip-content-available-width)',
          className,
        )}
        collisionPadding={8}
        data-slot="tooltip-content"
        sideOffset={sideOffset}
        {...props}
      >
        {children}
        <TooltipArrow />
      </TooltipPrimitive.Content>
    </TooltipPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: TooltipArrow
 * -------------------------------------------------------------------------- */

type TooltipArrowProps = ComponentProps<typeof TooltipPrimitive.Arrow>;

function TooltipArrow({ className, ...props }: TooltipArrowProps): JSX.Element {
  return <TooltipPrimitive.Arrow className={cn('fill-primary', className)} data-slot="tooltip-arrow" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Tooltip, TooltipArrow, TooltipContent, TooltipProvider, TooltipTrigger };
export type { TooltipArrowProps, TooltipContentProps, TooltipProps, TooltipProviderProps, TooltipTriggerProps };
