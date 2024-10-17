import * as PopoverPrimitive from '@radix-ui/react-popover';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
} from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Popover
 * -------------------------------------------------------------------------- */

type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root>;
const Popover = PopoverPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: PopoverTrigger
 * -------------------------------------------------------------------------- */

type PopoverTriggerProps = ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Trigger
>;
const PopoverTrigger = PopoverPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: PopoverAnchor
 * -------------------------------------------------------------------------- */

type PopoverAnchorProps = ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Anchor
>;
const PopoverAnchor = PopoverPrimitive.Anchor;

/* -----------------------------------------------------------------------------
 * Component: PopoverContent
 * -------------------------------------------------------------------------- */

type PopoverContentElement = ComponentRef<typeof PopoverPrimitive.Content>;
type PopoverContentProps = ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
>;

const PopoverContent = forwardRef<PopoverContentElement, PopoverContentProps>(
  ({ className, align = 'center', sideOffset = 6, ...props }, forwardedRef) => (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        ref={forwardedRef}
        align={align}
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-4 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
          'data-[state=open]:data-[side=top]:slide-in-from-bottom-2',
          'data-[state=open]:data-[side=right]:slide-in-from-left-2',
          'data-[state=open]:data-[side=bottom]:slide-in-from-top-2',
          'data-[state=open]:data-[side=left]:slide-in-from-right-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95',
          'data-[state=closed]:data-[side=top]:slide-out-to-bottom-2',
          'data-[state=closed]:data-[side=left]:slide-out-to-right-2',
          'data-[state=closed]:data-[side=bottom]:slide-out-to-top-2',
          'data-[state=closed]:data-[side=right]:slide-out-to-left-2',
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </PopoverPrimitive.Portal>
  ),
);

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: PopoverArrow
 * -------------------------------------------------------------------------- */

type PopoverArrowElement = ComponentRef<typeof PopoverPrimitive.Arrow>;
type PopoverArrowProps = ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Arrow
>;

const PopoverArrow = forwardRef<PopoverArrowElement, PopoverArrowProps>(
  ({ className, ...props }, forwardedRef) => (
    <PopoverPrimitive.Arrow
      ref={forwardedRef}
      className={cn('fill-popover', className)}
      {...props}
    />
  ),
);

PopoverArrow.displayName = PopoverPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Popover,
  PopoverAnchor,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  type PopoverAnchorProps,
  type PopoverArrowProps,
  type PopoverContentProps,
  type PopoverProps,
  type PopoverTriggerProps,
};
