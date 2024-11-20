import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { Slot } from '@radix-ui/react-slot';
import { ChevronRightIcon } from 'lucide-react';
import { type ComponentPropsWithoutRef, type ComponentRef, forwardRef, type JSX } from 'react';

import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Accordion
 * -------------------------------------------------------------------------- */

type AccordionProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Root>;
const Accordion = AccordionPrimitive.Root;

/* -----------------------------------------------------------------------------
 * Component: AccordionItem
 * -------------------------------------------------------------------------- */

type AccordionItemProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Item>;
const AccordionItem = AccordionPrimitive.Item;

/* -----------------------------------------------------------------------------
 * Component: AccordionIcon
 * -------------------------------------------------------------------------- */

interface AccordionIconProps extends ComponentPropsWithoutRef<typeof Slot> {
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

type AccordionTriggerElement = ComponentRef<typeof AccordionPrimitive.Trigger>;
type AccordionTriggerProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>;

const AccordionTrigger = forwardRef<AccordionTriggerElement, AccordionTriggerProps>(
  ({ className, ...props }, forwardedRef) => (
    <AccordionPrimitive.Header className="flex">
      <AccordionPrimitive.Trigger
        ref={forwardedRef}
        className={cn('group flex grow items-center gap-2 py-4 text-left text-sm font-medium', className)}
        {...props}
      />
    </AccordionPrimitive.Header>
  ),
);

AccordionTrigger.displayName = AccordionPrimitive.Trigger.displayName;

/* -----------------------------------------------------------------------------
 * Component: AccordionContent
 * -------------------------------------------------------------------------- */

type AccordionContentElement = ComponentRef<typeof AccordionPrimitive.Content>;
type AccordionContentProps = ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>;

const AccordionContent = forwardRef<AccordionContentElement, AccordionContentProps>(
  ({ children, className, ...props }, forwardedRef) => (
    <AccordionPrimitive.Content
      ref={forwardedRef}
      className={cn(
        'overflow-hidden text-sm',
        'data-[state=open]:animate-collapsible-open data-[state=closed]:animate-collapsible-closed',
      )}
      {...props}
    >
      <div className={cn('pb-4 pt-0', className)}>{children}</div>
    </AccordionPrimitive.Content>
  ),
);

AccordionContent.displayName = AccordionPrimitive.Content.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Accordion,
  AccordionContent,
  AccordionIcon,
  AccordionItem,
  AccordionTrigger,
  type AccordionContentProps,
  type AccordionIconProps,
  type AccordionItemProps,
  type AccordionProps,
  type AccordionTriggerProps,
};
