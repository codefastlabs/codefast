import type { ComponentProps, JSX } from 'react';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Accordion
 * -------------------------------------------------------------------------- */

type AccordionProps = ComponentProps<typeof AccordionPrimitive.Root>;

function Accordion({ ...props }: AccordionProps): JSX.Element {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AccordionItem
 * -------------------------------------------------------------------------- */

type AccordionItemProps = ComponentProps<typeof AccordionPrimitive.Item>;

function AccordionItem({ ...props }: AccordionItemProps): JSX.Element {
  return <AccordionPrimitive.Item data-slot="accordion-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AccordionIcon
 * -------------------------------------------------------------------------- */

interface AccordionIconProps extends ComponentProps<typeof Slot> {
  asChild?: boolean;
  className?: string;
}

function AccordionIcon({ asChild, className, ...props }: AccordionIconProps): JSX.Element {
  if (asChild) {
    return (
      <Slot
        className={cn('text-muted-foreground size-4 shrink-0 transition group-data-[state=open]:rotate-90', className)}
        data-slot="accordion-icon"
        {...props}
      />
    );
  }

  return (
    <ChevronRightIcon
      aria-hidden
      className={cn('text-muted-foreground size-4 shrink-0 transition group-data-[state=open]:rotate-90', className)}
      data-slot="accordion-icon"
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AccordionTrigger
 * -------------------------------------------------------------------------- */

type AccordionTriggerProps = ComponentProps<typeof AccordionPrimitive.Trigger>;

function AccordionTrigger({ className, ...props }: AccordionTriggerProps): JSX.Element {
  return (
    <AccordionPrimitive.Header className="flex" data-slot="accordion-trigger-wrapper">
      <AccordionPrimitive.Trigger
        className={cn(
          'focus-visible:ring-ring focus-visible:ring-3 group flex grow items-center gap-2 py-4 text-left text-sm font-medium focus-visible:outline-none',
          className,
        )}
        data-slot="accordion-trigger"
        {...props}
      />
    </AccordionPrimitive.Header>
  );
}

/* -----------------------------------------------------------------------------
 * Component: AccordionContent
 * -------------------------------------------------------------------------- */

type AccordionContentProps = ComponentProps<typeof AccordionPrimitive.Content>;

function AccordionContent({ children, className, ...props }: AccordionContentProps): JSX.Element {
  return (
    <AccordionPrimitive.Content
      className="data-[state=open]:animate-collapsible-open data-[state=closed]:animate-collapsible-closed overflow-hidden"
      data-slot="accordion-content"
      {...props}
    >
      <div className={cn('pb-4 pt-0 text-sm', className)}>{children}</div>
    </AccordionPrimitive.Content>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { AccordionContentProps, AccordionIconProps, AccordionItemProps, AccordionProps, AccordionTriggerProps };
export { Accordion, AccordionContent, AccordionIcon, AccordionItem, AccordionTrigger };
