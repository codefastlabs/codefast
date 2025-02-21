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
          'bg-popover text-popover-foreground z-50 min-w-32 rounded-md border p-4 shadow-md',
          'data-[state=open]:animate-motion-in data-[state=open]:motion-fade-in-0 data-[state=open]:motion-zoom-in-95',
          'data-[state=open]:data-[side=top]:motion-slide-in-b-2',
          'data-[state=open]:data-[side=left]:motion-slide-in-r-2',
          'data-[state=open]:data-[side=bottom]:motion-slide-in-t-2',
          'data-[state=open]:data-[side=right]:motion-slide-in-l-2',
          'data-[state=closed]:animate-motion-out data-[state=closed]:motion-fade-out-0 data-[state=closed]:motion-zoom-out-95',
          'data-[state=closed]:data-[side=top]:motion-slide-out-b-2',
          'data-[state=closed]:data-[side=left]:motion-slide-out-r-2',
          'data-[state=closed]:data-[side=bottom]:motion-slide-out-t-2',
          'data-[state=closed]:data-[side=right]:motion-slide-out-l-2',
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
