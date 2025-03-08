import type { ComponentProps, JSX } from 'react';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Accordion
 * -------------------------------------------------------------------------- */

function Accordion({ ...props }: ComponentProps<typeof AccordionPrimitive.Root>): JSX.Element {
  return <AccordionPrimitive.Root data-slot="accordion" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AccordionItem
 * -------------------------------------------------------------------------- */

function AccordionItem({ ...props }: ComponentProps<typeof AccordionPrimitive.Item>): JSX.Element {
  return <AccordionPrimitive.Item data-slot="accordion-item" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: AccordionIcon
 * -------------------------------------------------------------------------- */

function AccordionIcon({
  asChild,
  className,
  ...props
}: ComponentProps<typeof Slot> & {
  asChild?: boolean;
  className?: string;
}): JSX.Element {
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

function AccordionTrigger({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Trigger>): JSX.Element {
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

function AccordionContent({
  children,
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>): JSX.Element {
  return (
    <AccordionPrimitive.Content
      className="data-[state=open]:animate-accordion-down data-[state=closed]:animate-accordion-up overflow-hidden"
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

export { Accordion, AccordionContent, AccordionIcon, AccordionItem, AccordionTrigger };
