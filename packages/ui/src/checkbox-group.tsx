"use client";

import * as React from "react";
import { CheckIcon } from "@radix-ui/react-icons";
import * as CheckboxGroupPrimitive from "./checkbox-group.primitive";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * -------------------------------------------------------------------------- */

type CheckboxGroupElement = React.ElementRef<typeof CheckboxGroupPrimitive.Root>;
type CheckboxGroupProps = React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Root>;

const CheckboxGroup = React.forwardRef<CheckboxGroupElement, CheckboxGroupProps>(({ className, ...props }, ref) => {
  return <CheckboxGroupPrimitive.Root ref={ref} className={cn("grid gap-2", className)} {...props} />;
});

CheckboxGroup.displayName = "CheckboxGroup";

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * -------------------------------------------------------------------------- */

type CheckboxGroupItemElement = React.ElementRef<typeof CheckboxGroupPrimitive.Item>;
type CheckboxGroupItemProps = React.ComponentPropsWithoutRef<typeof CheckboxGroupPrimitive.Item>;

const CheckboxGroupItem = React.forwardRef<CheckboxGroupItemElement, CheckboxGroupItemProps>(
  ({ className, ...props }, ref) => {
    return (
      <CheckboxGroupPrimitive.Item
        ref={ref}
        className={cn(
          "border-compound/70 hover:border-compound aria-checked:border-primary aria-checked:bg-primary aria-checked:text-primary-foreground focus-visible:ring-ring peer size-4 shrink-0 rounded-sm border shadow focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className,
        )}
        {...props}
      >
        <CheckboxGroupPrimitive.CheckboxGroupIndicator className="flex size-full items-center justify-center text-current">
          <CheckIcon className="size-3.5" />
        </CheckboxGroupPrimitive.CheckboxGroupIndicator>
      </CheckboxGroupPrimitive.Item>
    );
  },
);

CheckboxGroupItem.displayName = "CheckboxGroupItem";

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { CheckboxGroup, CheckboxGroupItem, type CheckboxGroupProps, type CheckboxGroupItemProps };
