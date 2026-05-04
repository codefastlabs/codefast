"use client";

import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";
import * as AccordionPrimitive from "@radix-ui/react-accordion";
import { Slot } from "@radix-ui/react-slot";
import { ChevronDownIcon } from "lucide-react";

/* -----------------------------------------------------------------------------
 * Component: Accordion
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AccordionProps = ComponentProps<typeof AccordionPrimitive.Root>;

/**
 * @since 0.3.16-canary.0
 */
function Accordion({ ...props }: AccordionProps): JSX.Element {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AccordionItem
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AccordionItemProps = ComponentProps<typeof AccordionPrimitive.Item>;

/**
 * @since 0.3.16-canary.0
 */
function AccordionItem({ className, ...props }: AccordionItemProps): JSX.Element {
  return (
    <AccordionPrimitive.Item
      className={cn("border-b", "last:border-b-0", className)}
      data-slot="accordion-item"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AccordionIcon
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface AccordionIconProps extends ComponentProps<typeof Slot> {
  asChild?: boolean;
  className?: string;
}

/**
 * @since 0.3.16-canary.0
 */
function AccordionIcon({ asChild, className, ...props }: AccordionIconProps): JSX.Element {
  const Component = (asChild ? Slot : ChevronDownIcon) as typeof Slot;

  return (
    <Component
      aria-hidden
      className={cn(
        "size-4 shrink-0 text-muted-foreground",
        "translate-y-0.5 transition-transform duration-200",
        className,
      )}
      data-slot="accordion-icon"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AccordionTrigger
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AccordionTriggerProps = ComponentProps<typeof AccordionPrimitive.Trigger>;

/**
 * @since 0.3.16-canary.0
 */
function AccordionTrigger({ children, className, ...props }: AccordionTriggerProps): JSX.Element {
  return (
    <AccordionPrimitive.Header className="flex" data-slot="accordion-trigger-wrapper">
      <AccordionPrimitive.Trigger
        className={cn(
          "group/accordion-trigger flex grow items-start justify-between gap-4 py-4",
          "rounded-md outline-hidden",
          "text-left text-sm font-medium",
          "hover:not-disabled:underline",
          "focus-visible:ring-3 focus-visible:ring-ring/50",
          "disabled:opacity-50",
          "[&[data-state=open]>svg]:rotate-180",
          className,
        )}
        data-slot="accordion-trigger"
        {...props}
      >
        {children}
      </AccordionPrimitive.Trigger>
    </AccordionPrimitive.Header>
  );
}

/* -----------------------------------------------------------------------------
 * Component: AccordionContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type AccordionContentProps = ComponentProps<typeof AccordionPrimitive.Content>;

/**
 * @since 0.3.16-canary.0
 */
function AccordionContent({ children, className, ...props }: AccordionContentProps): JSX.Element {
  return (
    <AccordionPrimitive.Content
      className={cn(
        "overflow-hidden",
        "data-open:animate-collapsible-down",
        "data-closed:animate-collapsible-up",
      )}
      data-slot="accordion-content"
      {...props}
    >
      <div className={cn("pt-0 pb-4", "text-sm", className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Accordion, AccordionContent, AccordionIcon, AccordionItem, AccordionTrigger };
export type {
  AccordionContentProps,
  AccordionIconProps,
  AccordionItemProps,
  AccordionProps,
  AccordionTriggerProps,
};
