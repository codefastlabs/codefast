"use client";

import type { ComponentProps, JSX, ReactNode } from "react";

import type { VariantProps } from "@/lib/utils";
import type { Scope } from "@radix-ui/react-context";

import { toggleVariants } from "@/components/toggle/toggle.variants";
import { cn } from "@/lib/utils";
import { createContextScope } from "@radix-ui/react-context";
import * as ToggleGroupPrimitive from "@radix-ui/react-toggle-group";
import { createToggleGroupScope } from "@radix-ui/react-toggle-group";

/* -----------------------------------------------------------------------------
 * Context: ToggleGroup
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_NAME = "ToggleGroup";

type ScopedProps<P> = P & { __scopeToggleGroup?: Scope };

const [createToggleGroupContext] = createContextScope(TOGGLE_GROUP_NAME, [createToggleGroupScope]);

const useToggleGroupScope = createToggleGroupScope();

const [ToggleGroupProvider, useToggleGroupContext] =
  createToggleGroupContext<VariantProps<typeof toggleVariants>>(TOGGLE_GROUP_NAME);

/* -----------------------------------------------------------------------------
 * Component: ToggleGroup
 * -------------------------------------------------------------------------- */

type ToggleGroupProps = ComponentProps<typeof ToggleGroupPrimitive.Root> & VariantProps<typeof toggleVariants>;

function ToggleGroup({
  __scopeToggleGroup,
  children,
  className,
  size,
  variant,
  ...props
}: ScopedProps<ToggleGroupProps>): JSX.Element {
  const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

  return (
    <ToggleGroupProvider scope={__scopeToggleGroup} size={size} variant={variant}>
      <ToggleGroupPrimitive.Root
        className={cn("group/toggle-group flex w-fit items-center -space-x-px rounded-md", className)}
        data-size={size}
        data-slot="toggle-group"
        data-variant={variant}
        {...toggleGroupScope}
        {...props}
      >
        {children}
      </ToggleGroupPrimitive.Root>
    </ToggleGroupProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: ToggleGroupItem
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_ITEM_NAME = "ToggleGroupItem";

type ToggleGroupItemProps = ScopedProps<
  Omit<ComponentProps<typeof ToggleGroupPrimitive.Item>, "prefix"> & {
    prefix?: ReactNode;
    suffix?: ReactNode;
  }
>;

function ToggleGroupItem({
  __scopeToggleGroup,
  children,
  className,
  prefix,
  suffix,
  ...props
}: ToggleGroupItemProps): JSX.Element {
  const { size, variant } = useToggleGroupContext(TOGGLE_GROUP_ITEM_NAME, __scopeToggleGroup);
  const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

  return (
    <ToggleGroupPrimitive.Item
      className={toggleVariants({
        className: [
          "min-w-0 flex-1 shrink-0 rounded-none shadow-none first:rounded-l-md last:rounded-r-md focus:z-10 focus-visible:z-10",
          className,
        ],
        size,
        variant,
      })}
      data-slot="toggle-group-item"
      data-variant={variant}
      {...toggleGroupScope}
      {...props}
    >
      {prefix}
      {children}
      {suffix}
    </ToggleGroupPrimitive.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ToggleGroup, ToggleGroupItem };
export type { ToggleGroupItemProps, ToggleGroupProps };
