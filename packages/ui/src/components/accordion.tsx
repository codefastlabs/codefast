'use client';

import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import { accordionVariants } from '@/styles/accordion-variants';

/* -----------------------------------------------------------------------------
 * Variant: Accordion
 * -------------------------------------------------------------------------- */

const { header, trigger, icon, content, contentContainer } = accordionVariants();

/* -----------------------------------------------------------------------------
 * Component: Accordion
 * -------------------------------------------------------------------------- */

type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;
const Accordion = AccordionPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: AccordionItem
 * -------------------------------------------------------------------------- */

type AccordionItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;
const AccordionItem = AccordionPrimitive.Item;

/* -----------------------------------------------------------------------------
 * Component: AccordionTrigger
 * -------------------------------------------------------------------------- */

type AccordionTriggerElement = React.ElementRef<typeof AccordionPrimitive.Trigger>;
type AccordionTriggerProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>;

const AccordionTrigger = React.forwardRef<AccordionTriggerElement, AccordionTriggerProps>(
  ({ className, ...props }, forwardedRef) => (
    <AccordionPrimitive.Header className={header()}>
      <AccordionPrimitive.Trigger ref={forwardedRef} className={trigger({ className })} {...props} />
    </AccordionPrimitive.Header>
  ),
);

AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: AccordionIcon
 * -------------------------------------------------------------------------- */

interface AccordionIconProps extends React.ComponentPropsWithoutRef<typeof Slot> {
  asChild?: boolean;
  className?: string;
}

function AccordionIcon({ asChild, className, ...props }: AccordionIconProps): React.JSX.Element {
  if (asChild) {
    return <Slot className={icon({ className })} {...props} />;
  }

  return <ChevronRightIcon aria-hidden className={icon({ className })} />;
}

/* -----------------------------------------------------------------------------
 * Component: AccordionContent
 * -------------------------------------------------------------------------- */

type AccordionContentElement = React.ElementRef<typeof AccordionPrimitive.Content>;
type AccordionContentProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>;

const AccordionContent = React.forwardRef<AccordionContentElement, AccordionContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <AccordionPrimitive.Content ref={forwardedRef} className={content()} {...props}>
      <div className={contentContainer({ className })}>{children}</div>
    </AccordionPrimitive.Content>
  ),
);

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
  AccordionIcon,
  type AccordionProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
  type AccordionIconProps,
};
