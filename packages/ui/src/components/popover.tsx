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

function PopoverContent({ align = 'center', className, sideOffset = 6, ...props }: PopoverContentProps): JSX.Element {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          'bg-popover text-popover-foreground ring-border data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-from-b-2 data-[state=open]:data-[side=right]:slide-from-l-2 data-[state=open]:data-[side=bottom]:slide-from-t-2 data-[state=open]:data-[side=left]:slide-from-r-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-to-b-2 data-[state=closed]:data-[side=right]:slide-to-l-2 data-[state=closed]:data-[side=bottom]:slide-to-t-2 data-[state=closed]:data-[side=left]:slide-to-r-2 z-50 min-w-32 rounded-xl p-4 shadow-lg ring',
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

export type { PopoverAnchorProps, PopoverArrowProps, PopoverContentProps, PopoverProps, PopoverTriggerProps };
export { Popover, PopoverAnchor, PopoverArrow, PopoverContent, PopoverTrigger };
