'use client';

import * as React from 'react';
import * as PopoverPrimitive from '@radix-ui/react-popover';
import { cn } from '../lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Popover
 * -------------------------------------------------------------------------- */

type PopoverProps = React.ComponentProps<typeof PopoverPrimitive.Root>;
const Popover = PopoverPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: PopoverTrigger
 * -------------------------------------------------------------------------- */

type PopoverTriggerProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Trigger
>;
const PopoverTrigger = PopoverPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: PopoverAnchor
 * -------------------------------------------------------------------------- */

type PopoverAnchorProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Anchor
>;
const PopoverAnchor = PopoverPrimitive.Anchor;

/* -----------------------------------------------------------------------------
 * Component: PopoverContent
 * -------------------------------------------------------------------------- */

type PopoverContentElement = React.ElementRef<typeof PopoverPrimitive.Content>;
type PopoverContentProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Content
>;

const PopoverContent = React.forwardRef<
  PopoverContentElement,
  PopoverContentProps
>(({ className, align = 'center', sideOffset = 6, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      className={cn(
        'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 z-50 min-w-32 rounded-md border p-4 shadow-md',
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));

PopoverContent.displayName = PopoverPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: PopoverArrow
 * -------------------------------------------------------------------------- */

type PopoverArrowElement = React.ElementRef<typeof PopoverPrimitive.Arrow>;
type PopoverArrowProps = React.ComponentPropsWithoutRef<
  typeof PopoverPrimitive.Arrow
>;

const PopoverArrow = React.forwardRef<PopoverArrowElement, PopoverArrowProps>(
  ({ className, ...props }, ref) => (
    <PopoverPrimitive.Arrow
      ref={ref}
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
  PopoverTrigger,
  PopoverContent,
  PopoverAnchor,
  PopoverArrow,
  type PopoverProps,
  type PopoverTriggerProps,
  type PopoverContentProps,
  type PopoverAnchorProps,
  type PopoverArrowProps,
};
