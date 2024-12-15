import type { ComponentProps, ComponentPropsWithoutRef, ComponentRef } from 'react';

import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { forwardRef } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: HoverCard
 * -------------------------------------------------------------------------- */

type HoverCardProps = ComponentProps<typeof HoverCardPrimitive.Root>;
const HoverCard = HoverCardPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: HoverCardTrigger
 * -------------------------------------------------------------------------- */

type HoverCardTriggerProps = ComponentPropsWithoutRef<typeof HoverCardPrimitive.Trigger>;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: HoverCardContent
 * -------------------------------------------------------------------------- */

type HoverCardContentElement = ComponentRef<typeof HoverCardPrimitive.Content>;
type HoverCardContentProps = ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>;

const HoverCardContent = forwardRef<HoverCardContentElement, HoverCardContentProps>(
  ({ align = 'center', className, sideOffset = 6, ...props }, forwardedRef) => (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={forwardedRef}
        align={align}
        className={cn(
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-4 shadow-md',
          'data-[state=open]:animate-in data-[state=open]:fade-in data-[state=open]:zoom-in-95',
          'data-[state=open]:data-[side=top]:slide-in-from-bottom-2',
          'data-[state=open]:data-[side=left]:slide-in-from-right-2',
          'data-[state=open]:data-[side=bottom]:slide-in-from-top-2',
          'data-[state=open]:data-[side=right]:slide-in-from-left-2',
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
    </HoverCardPrimitive.Portal>
  ),
);

HoverCardContent.displayName = HoverCardPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Component: HoverCardArrow
 * -------------------------------------------------------------------------- */

type HoverCardArrowElement = ComponentRef<typeof HoverCardPrimitive.Arrow>;
type HoverCardArrowProps = ComponentPropsWithoutRef<typeof HoverCardPrimitive.Arrow>;

const HoverCardArrow = forwardRef<HoverCardArrowElement, HoverCardArrowProps>(
  ({ className, ...props }, forwardedRef) => (
    <HoverCardPrimitive.Arrow ref={forwardedRef} className={cn('fill-popover', className)} {...props} />
  ),
);

HoverCardArrow.displayName = HoverCardPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { HoverCardArrowProps, HoverCardContentProps, HoverCardProps, HoverCardTriggerProps };
export { HoverCard, HoverCardArrow, HoverCardContent, HoverCardTrigger };
