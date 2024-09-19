'use client';

import * as React from 'react';
import * as HoverCardPrimitive from '@radix-ui/react-hover-card';
import { hoverCardVariants } from '@/styles/hover-card-variants';

/* -----------------------------------------------------------------------------
 * Variant: HoverCard
 * -------------------------------------------------------------------------- */

const { content, arrow } = hoverCardVariants();

/* -----------------------------------------------------------------------------
 * Component: HoverCard
 * -------------------------------------------------------------------------- */

type HoverCardProps = React.ComponentProps<typeof HoverCardPrimitive.Root>;
const HoverCard = HoverCardPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: HoverCardTrigger
 * -------------------------------------------------------------------------- */

type HoverCardTriggerProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Trigger>;
const HoverCardTrigger = HoverCardPrimitive.Trigger;

/* -----------------------------------------------------------------------------
 * Component: HoverCardContent
 * -------------------------------------------------------------------------- */

type HoverCardContentElement = React.ElementRef<typeof HoverCardPrimitive.Content>;
type HoverCardContentProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Content>;

const HoverCardContent = React.forwardRef<HoverCardContentElement, HoverCardContentProps>(
  ({ className, align = 'center', sideOffset = 6, ...props }, forwardedRef) => (
    <HoverCardPrimitive.Portal>
      <HoverCardPrimitive.Content
        ref={forwardedRef}
        align={align}
        className={content({ className })}
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

type HoverCardArrowElement = React.ElementRef<typeof HoverCardPrimitive.Arrow>;
type HoverCardArrowProps = React.ComponentPropsWithoutRef<typeof HoverCardPrimitive.Arrow>;

const HoverCardArrow = React.forwardRef<HoverCardArrowElement, HoverCardArrowProps>(
  ({ className, ...props }, forwardedRef) => (
    <HoverCardPrimitive.Arrow ref={forwardedRef} className={arrow({ className })} {...props} />
  ),
);

HoverCardArrow.displayName = HoverCardPrimitive.Arrow.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  HoverCard,
  HoverCardTrigger,
  HoverCardContent,
  HoverCardArrow,
  type HoverCardProps,
  type HoverCardTriggerProps,
  type HoverCardContentProps,
  type HoverCardArrowProps,
};
