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
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-4 shadow-md',
          'data-[state=open]:animate-motion-in data-[state=open]:motion-fade-in-0 data-[state=open]:motion-zoom-in-95',
          'data-[state=open]:data-[side=top]:motion-slide-in-b-2',
          'data-[state=open]:data-[side=right]:motion-slide-in-l-2',
          'data-[state=open]:data-[side=bottom]:motion-slide-in-t-2',
          'data-[state=open]:data-[side=left]:motion-slide-in-r-2',
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
