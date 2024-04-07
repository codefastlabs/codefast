"use client";

import * as React from "react";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { createToggleGroupScope } from "@radix-ui/react-toggle-group";
import { createContextScope, type Scope } from "@radix-ui/react-context";
import { toggleVariants, type ToggleVariantsProps } from "./toggle";
import { cn } from "./utils";

/* -----------------------------------------------------------------------------
 * Component: ToggleGroup
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_NAME = "ToggleGroup";

type ScopedProps<P> = P & { __scopeToggleGroup?: Scope };

const [createToggleGroupContext] = createContextScope(TOGGLE_GROUP_NAME, [createToggleGroupScope]);

const useToggleGroupScope = createToggleGroupScope();

const [ToggleGroupProvider, useToggleGroupContext] = createToggleGroupContext<ToggleVariantsProps>(TOGGLE_GROUP_NAME);

type ToggleGroupElement = React.ElementRef<typeof ToggleGroupPrimitive.Root>;
type ToggleGroupProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Root> & ToggleVariantsProps;

const ToggleGroup = React.forwardRef<ToggleGroupElement, ToggleGroupProps>(
  ({ __scopeToggleGroup, className, variant, size, children, ...props }: ScopedProps<ToggleGroupProps>, ref) => {
    const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

    return (
      <ToggleGroupProvider scope={__scopeToggleGroup} size={size} variant={variant}>
        <ToggleGroupPrimitive.Root
          ref={ref}
          className={cn("flex items-center justify-center gap-1", className)}
          {...toggleGroupScope}
          {...props}
        >
          {children}
        </ToggleGroupPrimitive.Root>
      </ToggleGroupProvider>
    );
  },
);

ToggleGroup.displayName = TOGGLE_GROUP_NAME;

/* -----------------------------------------------------------------------------
 * Component: ToggleGroupItem
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_ITEM_NAME = "ToggleGroupItem";

type ToggleGroupItemElement = React.ElementRef<typeof ToggleGroupPrimitive.Item>;
type ToggleGroupItemProps = React.ComponentPropsWithoutRef<typeof ToggleGroupPrimitive.Item>;

const ToggleGroupItem = React.forwardRef<ToggleGroupItemElement, ToggleGroupItemProps>(
  ({ __scopeToggleGroup, className, children, ...props }: ScopedProps<ToggleGroupItemProps>, ref) => {
    const context = useToggleGroupContext(TOGGLE_GROUP_ITEM_NAME, __scopeToggleGroup);
    const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

    return (
      <ToggleGroupPrimitive.Item
        ref={ref}
        className={toggleVariants({ ...context, className })}
        {...toggleGroupScope}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Item>
    );
  },
);

ToggleGroupItem.displayName = TOGGLE_GROUP_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ToggleGroup, ToggleGroupItem, type ToggleGroupProps, type ToggleGroupItemProps };
