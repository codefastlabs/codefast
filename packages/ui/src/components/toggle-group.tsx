import { ToggleGroup as ToggleGroupPrimitive } from "radix-ui";
import { Context } from "radix-ui/internal";
import type { ComponentProps, CSSProperties, JSX } from "react";

import type { VariantProps } from "#/lib/utils";
import { cn } from "#/lib/utils";
import { toggleVariants } from "#/variants/toggle";

/* -----------------------------------------------------------------------------
 * Context: ToggleGroup
 * -------------------------------------------------------------------------- */

const TOGGLE_GROUP_NAME = "ToggleGroup";

type ScopedProps<P> = P & { __scopeToggleGroup?: Context.Scope };

const [createToggleGroupContext] = Context.createContextScope(TOGGLE_GROUP_NAME, [
  ToggleGroupPrimitive.createToggleGroupScope,
]);

const useToggleGroupScope = ToggleGroupPrimitive.createToggleGroupScope();

const [ToggleGroupProvider, useToggleGroupContext] = createToggleGroupContext<
  VariantProps<typeof toggleVariants> & {
    orientation?: "horizontal" | "vertical";
    spacing?: number;
  }
>(TOGGLE_GROUP_NAME);

/* -----------------------------------------------------------------------------
 * Component: ToggleGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ToggleGroupProps = ComponentProps<typeof ToggleGroupPrimitive.Root> &
  VariantProps<typeof toggleVariants> & {
    orientation?: "horizontal" | "vertical";
    spacing?: number;
  };

/**
 * @since 0.3.16-canary.0
 */
function ToggleGroup({
  __scopeToggleGroup,
  children,
  className,
  orientation = "horizontal",
  size,
  spacing = 2,
  variant,
  ...props
}: ScopedProps<ToggleGroupProps>): JSX.Element {
  const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

  return (
    <ToggleGroupProvider
      orientation={orientation}
      scope={__scopeToggleGroup}
      size={size}
      spacing={spacing}
      variant={variant}
    >
      <ToggleGroupPrimitive.Root
        className={cn(
          "group/toggle-group flex w-fit flex-row items-center gap-[--spacing(var(--gap))] rounded-md data-[spacing=0]:data-[variant=outline]:shadow-xs data-vertical:flex-col data-vertical:items-stretch",
          className,
        )}
        data-orientation={orientation}
        data-size={size}
        data-slot="toggle-group"
        data-spacing={spacing}
        data-variant={variant}
        style={{ "--gap": spacing } as CSSProperties}
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

/**
 * @since 0.3.16-canary.0
 */
type ToggleGroupItemProps = ScopedProps<
  ComponentProps<typeof ToggleGroupPrimitive.Item> & VariantProps<typeof toggleVariants>
>;

/**
 * @since 0.3.16-canary.0
 */
function ToggleGroupItem({
  __scopeToggleGroup,
  className,
  size = "default",
  variant = "default",
  ...props
}: ToggleGroupItemProps): JSX.Element {
  const context = useToggleGroupContext(TOGGLE_GROUP_ITEM_NAME, __scopeToggleGroup);
  const toggleGroupScope = useToggleGroupScope(__scopeToggleGroup);

  return (
    <ToggleGroupPrimitive.Item
      className={cn(
        "shrink-0 group-data-[spacing=0]/toggle-group:rounded-none group-data-[spacing=0]/toggle-group:px-2 group-data-[spacing=0]/toggle-group:shadow-none focus:z-10 focus-visible:z-10 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-end]:pe-1.5 group-data-[spacing=0]/toggle-group:has-data-[icon=inline-start]:ps-1.5 group-data-horizontal/toggle-group:data-[spacing=0]:first:rounded-s-md group-data-vertical/toggle-group:data-[spacing=0]:first:rounded-t-md group-data-horizontal/toggle-group:data-[spacing=0]:last:rounded-e-md group-data-vertical/toggle-group:data-[spacing=0]:last:rounded-b-md group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:border-s-0 group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:border-t-0 group-data-horizontal/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-s group-data-vertical/toggle-group:data-[spacing=0]:data-[variant=outline]:first:border-t data-on:bg-muted",
        toggleVariants({
          className,
          size: context.size ?? size,
          variant: context.variant ?? variant,
        }),
      )}
      data-size={context.size ?? size}
      data-slot="toggle-group-item"
      data-spacing={context.spacing}
      data-variant={context.variant ?? variant}
      {...toggleGroupScope}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ToggleGroup, ToggleGroupItem };
export type { ToggleGroupItemProps, ToggleGroupProps };
