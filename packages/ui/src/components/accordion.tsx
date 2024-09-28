import * as React from 'react';
import * as AccordionPrimitive from '@radix-ui/react-accordion';
import { ChevronRightIcon } from '@radix-ui/react-icons';
import { Slot } from '@radix-ui/react-slot';
import { cn } from '@/lib/utils';

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
 * Component: AccordionIcon
 * -------------------------------------------------------------------------- */

interface AccordionIconProps extends React.ComponentPropsWithoutRef<typeof Slot> {
  asChild?: boolean;
  className?: string;
}

function AccordionIcon({ asChild, className, ...props }: AccordionIconProps): React.JSX.Element {
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

type AccordionTriggerElement = React.ElementRef<typeof AccordionPrimitive.Trigger>;
type AccordionTriggerProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Trigger>;

const AccordionTrigger = React.forwardRef<AccordionTriggerElement, AccordionTriggerProps>(
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

type AccordionContentElement = React.ElementRef<typeof AccordionPrimitive.Content>;
type AccordionContentProps = React.ComponentPropsWithoutRef<typeof AccordionPrimitive.Content>;

const AccordionContent = React.forwardRef<AccordionContentElement, AccordionContentProps>(
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
