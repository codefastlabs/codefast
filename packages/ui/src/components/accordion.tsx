import type { ComponentProps, JSX } from 'react';

import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon } from 'lucide-react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Accordion
 * -------------------------------------------------------------------------- */

type AccordionProps = ComponentProps<typeof AccordionPrimitive.Root>;
const Accordion = AccordionPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: AccordionItem
 * -------------------------------------------------------------------------- */

type AccordionItemProps = ComponentProps<typeof AccordionPrimitive.Item>;
const AccordionItem = AccordionPrimitive.Item;

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
        className={cn(
          'text-muted-foreground size-4 shrink-0 transition',
          'group-data-[state=open]:rotate-90',
          className,
        )}
        {...props}
      />
    );
  }

  return (
    <ChevronRightIcon
      aria-hidden
      className={cn('text-muted-foreground size-4 shrink-0 transition', 'group-data-[state=open]:rotate-90', className)}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: AccordionTrigger
 * -------------------------------------------------------------------------- */

type AccordionTriggerProps = ComponentProps<typeof AccordionPrimitive.Trigger>;

function AccordionTrigger({ className, ...props }: AccordionTriggerProps): JSX.Element {
  return (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        className={cn(
          'group flex grow items-center gap-2 py-4 text-left text-sm font-medium',
          'focus-visible:ring-ring focus-visible:ring-3 focus-visible:outline-none',
          className,
        )}
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
      className={cn(
        'overflow-hidden',
        'data-[state=open]:animate-collapsible-open',
        'data-[state=closed]:animate-collapsible-closed',
      )}
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
