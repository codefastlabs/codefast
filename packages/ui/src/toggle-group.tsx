"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { toggleVariants, type ToggleVariantsProps } from "./toggle";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Context: ToggleGroup
 * -------------------------------------------------------------------------- */

const ToggleGroupContext = React.createContext<ToggleVariantsProps>({
  size: "default",
  variant: "default",
});

/* -----------------------------------------------------------------------------
 * Component: ToggleGroup
 * -------------------------------------------------------------------------- */

type ToggleGroupProps = React.ComponentPropsWithoutRef<
  typeof ToggleGroupPrimitive.Root
> &
  ToggleVariantsProps;
const ToggleGroup = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Root>,
  ToggleGroupProps
>(({ className, variant, size, children, ...props }, ref) => (
  <ToggleGroupPrimitive.Root
    ref={ref}
    className={cn("flex items-center justify-center gap-1", className)}
    {...props}
  >
    <ToggleGroupContext.Provider value={{ variant, size }}>
      {children}
    </ToggleGroupContext.Provider>
  </ToggleGroupPrimitive.Root>
));
ToggleGroup.displayName = ToggleGroupPrimitive.Root.displayName;

/* -----------------------------------------------------------------------------
 * Component: ToggleGroupItem
 * -------------------------------------------------------------------------- */

type ToggleGroupItemProps = ToggleGroupPrimitive.ToggleGroupItemProps &
  ToggleVariantsProps;
const ToggleGroupItem = React.forwardRef<
  React.ElementRef<typeof ToggleGroupPrimitive.Item>,
  ToggleGroupItemProps
>(({ className, children, variant, size, ...props }, ref) => {
  const context = React.useContext(ToggleGroupContext);

  return (
    <ToggleGroupPrimitive.Item
      ref={ref}
      className={cn(
        toggleVariants({
          variant: context.variant ?? variant,
          size: context.size ?? size,
        }),
        className,
      )}
      {...props}
    >
      {children}
    </ToggleGroupPrimitive.Item>
  );
});
ToggleGroupItem.displayName = ToggleGroupPrimitive.Item.displayName;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  ToggleGroup,
  ToggleGroupItem,
  type ToggleGroupProps,
  type ToggleGroupItemProps,
};
