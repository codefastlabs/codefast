import { ChevronDownIcon, ChevronUpIcon } from "lucide-react";
import * as AccordionPrimitive from "radix-ui/accordion";
import type { ComponentProps, JSX } from "react";

import { cn } from "#/lib/utils";

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
function Accordion({ className, ...props }: AccordionProps): JSX.Element {
  return <AccordionPrimitive.Root className={cn("flex w-full flex-col", className)} data-slot="accordion" {...props} />;
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
    <AccordionPrimitive.Item className={cn("not-last:border-b", className)} data-slot="accordion-item" {...props} />
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
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          "group/accordion-trigger relative flex flex-1 items-start justify-between rounded-lg border border-transparent py-2.5 text-start text-sm font-medium transition-all outline-none hover:underline focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:after:border-ring disabled:pointer-events-none disabled:opacity-50 **:data-[slot=accordion-trigger-icon]:ms-auto **:data-[slot=accordion-trigger-icon]:size-4 **:data-[slot=accordion-trigger-icon]:text-muted-foreground",
          className,
        )}
        data-slot="accordion-trigger"
        {...props}
      >
        {children}
        <ChevronDownIcon
          className="pointer-events-none shrink-0 group-aria-expanded/accordion-trigger:hidden"
          data-slot="accordion-trigger-icon"
        />
        <ChevronUpIcon
          className="pointer-events-none hidden shrink-0 group-aria-expanded/accordion-trigger:inline"
          data-slot="accordion-trigger-icon"
        />
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
      className="overflow-hidden text-sm ease-snappy data-open:animate-accordion-down data-open:animation-duration-expand-in data-closed:animate-accordion-up data-closed:ease-exit data-closed:animation-duration-expand-out"
      data-slot="accordion-content"
      {...props}
    >
      <div
        className={cn(
          "h-(--radix-accordion-content-height) pt-0 pb-2.5 [&_a]:underline [&_a]:underline-offset-3 [&_a]:hover:text-foreground [&_p:not(:last-child)]:mb-4",
          className,
        )}
      >
        {children}
      </div>
    </AccordionPrimitive.Content>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { Accordion, AccordionContent, AccordionItem, AccordionTrigger };
export type { AccordionContentProps, AccordionItemProps, AccordionProps, AccordionTriggerProps };
