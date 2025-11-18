'use client';

import type { ComponentProps, JSX } from 'react';

import { cn } from '@codefast/tailwind-variants';
import * as PopoverPrimitive from '@radix-ui/react-popover';

/* -----------------------------------------------------------------------------
 * Component: Popover
 * -------------------------------------------------------------------------- */

type PopoverProps = ComponentProps<typeof PopoverPrimitive.Root>;

function Popover({ ...props }: PopoverProps): JSX.Element {
  return <PopoverPrimitive.Root data-slot="popover" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverTrigger
 * -------------------------------------------------------------------------- */

type PopoverTriggerProps = ComponentProps<typeof PopoverPrimitive.Trigger>;

function PopoverTrigger({ ...props }: PopoverTriggerProps): JSX.Element {
  return <PopoverPrimitive.Trigger data-slot="popover-trigger" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverAnchor
 * -------------------------------------------------------------------------- */

type PopoverAnchorProps = ComponentProps<typeof PopoverPrimitive.Anchor>;

function PopoverAnchor({ ...props }: PopoverAnchorProps): JSX.Element {
  return <PopoverPrimitive.Anchor data-slot="popover-anchor" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: PopoverContent
 * -------------------------------------------------------------------------- */

type PopoverContentProps = ComponentProps<typeof PopoverPrimitive.Content>;

function PopoverContent({ align = 'center', className, sideOffset = 4, ...props }: PopoverContentProps): JSX.Element {
  return (
    <PopoverPrimitive.Portal>
      <PopoverPrimitive.Content
        align={align}
        className={cn(
          'bg-popover text-popover-foreground data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95 data-[state=open]:data-[side=top]:slide-in-from-bottom-2 data-[state=open]:data-[side=right]:slide-in-from-left-2 data-[state=open]:data-[side=bottom]:slide-in-from-top-2 data-[state=open]:data-[side=left]:slide-in-from-right-2 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[state=closed]:data-[side=top]:slide-out-to-bottom-2 data-[state=closed]:data-[side=right]:slide-out-to-left-2 data-[state=closed]:data-[side=bottom]:slide-out-to-top-2 data-[state=closed]:data-[side=left]:slide-out-to-right-2 ease-ui z-50 min-w-32 rounded-lg border p-4 shadow-lg outline-hidden',
          className,
        )}
        data-slot="popover-content"
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
  return <PopoverPrimitive.Arrow className={cn('fill-popover', className)} data-slot="popover-arrow" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Popover, PopoverAnchor, PopoverArrow, PopoverContent, PopoverTrigger };
export type { PopoverAnchorProps, PopoverArrowProps, PopoverContentProps, PopoverProps, PopoverTriggerProps };
