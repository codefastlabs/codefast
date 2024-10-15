import { cn } from '@/lib/utils';
import * as TooltipPrimitive from '@radix-ui/react-tooltip';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

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

type TooltipTriggerProps = ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Trigger
>;
const TooltipTrigger = TooltipPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: TooltipContent
 * -------------------------------------------------------------------------- */

type TooltipContentElement = ComponentRef<typeof TooltipPrimitive.Content>;
type TooltipContentProps = ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Content
>;

const TooltipContent = forwardRef<TooltipContentElement, TooltipContentProps>(
  ({ className, sideOffset = 6, ...props }, forwardedRef) => (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        ref={forwardedRef}
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
  ),
);

TooltipContent.displayName = TooltipPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: TooltipArrow
 * -------------------------------------------------------------------------- */

type TooltipArrowElement = ComponentRef<typeof TooltipPrimitive.Arrow>;
type TooltipArrowProps = ComponentPropsWithoutRef<
  typeof TooltipPrimitive.Arrow
>;

const TooltipArrow = forwardRef<TooltipArrowElement, TooltipArrowProps>(
  ({ className, ...props }, forwardedRef) => (
    <TooltipPrimitive.Arrow
      ref={forwardedRef}
      className={cn('fill-popover', className)}
      {...props}
    />
  ),
);

TooltipArrow.displayName = TooltipPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Tooltip,
  TooltipArrow,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
  type TooltipArrowProps,
  type TooltipContentProps,
  type TooltipProps,
  type TooltipProviderProps,
  type TooltipTriggerProps,
};
