"use client";

import * as React from "react";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { ChevronDownIcon } from "@radix-ui/react-icons";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: Accordion
 * -------------------------------------------------------------------------- */

type AccordionProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;
const Accordion = AccordionPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: AccordionItem
 * -------------------------------------------------------------------------- */

type AccordionItemElement = React.ElementRef<typeof AccordionPrimitive.Item>;
type AccordionItemProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;

const AccordionItem = React.forwardRef<AccordionItemElement, AccordionItemProps>(({ className, ...props }, ref) => (
  <AccordionPrimitive.Item ref={ref} className={cn("border-b", className)} {...props} />
));

AccordionItem.displayName = AccordionPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Component: AccordionTrigger
 * -------------------------------------------------------------------------- */

type AccordionTriggerElement = React.ElementRef<typeof AccordionPrimitive.Trigger>;
type AccordionTriggerProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>;

const AccordionTrigger = React.forwardRef<AccordionTriggerElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={ref}
        className={cn(
          "group flex flex-1 items-center justify-between py-4 text-sm font-medium transition-all hover:underline",
          className,
        )}
        {...props}
      >
        {children}
        <ChevronDownIcon className="text-muted-foreground size-4 shrink-0 transition-transform duration-200 group-data-[state=open]:rotate-180" />
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  ),
);

AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: AccordionContent
 * -------------------------------------------------------------------------- */

type AccordionContentElement = React.ElementRef<typeof AccordionPrimitive.Content>;
type AccordionContentProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>;

const AccordionContent = React.forwardRef<AccordionContentElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => (
    <AccordionPrimitive.Content
      ref={ref}
      className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden text-sm"
      {...props}
    >
      <div className={cn("pb-4 pt-0", className)}>{children}</div>
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
  type AccordionProps,
  type AccordionItemProps,
  type AccordionTriggerProps,
  type AccordionContentProps,
};
