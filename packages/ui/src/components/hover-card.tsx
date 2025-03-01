import type { ComponentProps, JSX } from 'react';

import * as HoverCardPrimitive from '@radix-ui/react-hover-card';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: HoverCard
 * -------------------------------------------------------------------------- */

type HoverCardProps = ComponentProps<typeof HoverCardPrimitive.Root>;
const HoverCard = HoverCardPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: HoverCardTrigger
 * -------------------------------------------------------------------------- */

type HoverCardTriggerProps = ComponentProps<typeof HoverCardPrimitive.Trigger>;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: HoverCardContent
 * -------------------------------------------------------------------------- */

type HoverCardContentProps = ComponentProps<typeof HoverCardPrimitive.Content>;

function HoverCardContent({
  align = 'center',
  className,
  sideOffset = 6,
  ...props
}: HoverCardContentProps): JSX.Element {
  return (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        align={align}
        className={cn(
          'bg-popover text-popover-foreground ring-border shadow-border z-50 min-w-32 rounded-xl p-4 shadow-lg ring',
          'data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:zoom-in-95',
          'data-[state=open]:data-[side=top]:slide-from-b-2',
          'data-[state=open]:data-[side=left]:slide-from-r-2',
          'data-[state=open]:data-[side=bottom]:slide-from-t-2',
          'data-[state=open]:data-[side=right]:slide-from-l-2',
          'data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95',
          'data-[state=closed]:data-[side=top]:slide-to-b-2',
          'data-[state=closed]:data-[side=left]:slide-to-r-2',
          'data-[state=closed]:data-[side=bottom]:slide-to-t-2',
          'data-[state=closed]:data-[side=right]:slide-to-l-2',
          className,
        )}
        sideOffset={sideOffset}
        {...props}
      />
    </HoverCardPrimitive.Portal>
  );
}

/* -----------------------------------------------------------------------------
 * Component: HoverCardArrow
 * -------------------------------------------------------------------------- */

type HoverCardArrowProps = ComponentProps<typeof HoverCardPrimitive.Arrow>;

function HoverCardArrow({ className, ...props }: HoverCardArrowProps): JSX.Element {
  return <HoverCardPrimitive.Arrow className={cn('fill-popover', className)} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { HoverCardArrowProps, HoverCardContentProps, HoverCardProps, HoverCardTriggerProps };
export { HoverCard, HoverCardArrow, HoverCardContent, HoverCardTrigger };
