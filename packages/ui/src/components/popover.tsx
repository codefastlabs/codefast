import type { ComponentProps, JSX } from 'react';

import * as PopoverPrimitive from '@radix-ui/react-popover';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Popover
 * -------------------------------------------------------------------------- */

type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root>;
const Popover = PopoverPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: PopoverTrigger
 * -------------------------------------------------------------------------- */

type PopoverTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger>;
const PopoverTrigger = PopoverPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: PopoverAnchor
 * -------------------------------------------------------------------------- */

type PopoverAnchorProps = ComponentProps<typeof PopoverPrimitive.Anchor>;
const PopoverAnchor = PopoverPrimitive.Anchor;

/* -----------------------------------------------------------------------------
 * Component: PopoverContent
 * -------------------------------------------------------------------------- */

type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content>;

function PopoverContent({
  align = 'center',
  className,
  sideOffset = 6,
  ...props
}: PopoverContentProps): JSX.Element {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
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
  );
}

/* -----------------------------------------------------------------------------
 * Component: PopoverArrow
 * -------------------------------------------------------------------------- */

type PopoverArrowProps = ComponentProps<typeof PopoverPrimitive.Arrow>;

function PopoverArrow({ className, ...props }: PopoverArrowProps): JSX.Element {
  return <PopoverPrimitive.Arrow className={cn('fill-popover', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type {
  PopoverAnchorProps,
  PopoverArrowProps,
  PopoverContentProps,
  PopoverProps,
  PopoverTriggerProps,
};
export { Popover, PopoverAnchor, PopoverArrow, PopoverContent, PopoverTrigger };
