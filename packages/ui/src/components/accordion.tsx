import type { ComponentProps, JSX } from 'react';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Slot } from '@radix-ui/react-slot';
import { ChevronDownIcon } from 'lucide-react';

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

function AccordionItem({ className, ...props }: ComponentProps<typeof AccordionPrimitive.Item>): JSX.Element {
  return (
    <AccordionPrimitive.Item
      className={cn('border-b last:border-b-0', className)}
      data-slot="accordion-item"
      {...props}
    />
  );
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
  const Component = (asChild ? Slot : ChevronDownIcon) as typeof Slot;

  return (
    <Component
      aria-hidden
      className={cn(
        'text-muted-foreground size-4 shrink-0 translate-y-0.5 transition-transform duration-200',
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

function AccordionTrigger({
  className,
  children,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Trigger>): JSX.Element {
  return (
    <AccordionPrimitive.Header className="flex" data-slot="accordion-trigger-wrapper">
      <AccordionPrimitive.Trigger
        className={cn(
          'focus-visible:ring-ring/20 focus-visible:ring-3 outline-hidden hover:not-disabled:underline group/accordion-trigger flex grow items-start justify-between gap-4 rounded-md py-4 text-left text-sm font-medium disabled:opacity-50 [&[data-state=open]>svg]:rotate-180',
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

function AccordionContent({
  children,
  className,
  ...props
}: ComponentProps<typeof AccordionPrimitive.Content>): JSX.Element {
  return (
    <AccordionPrimitive.Content
      className="data-[state=open]:animate-collapsible-down data-[state=closed]:animate-collapsible-up overflow-hidden"
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
