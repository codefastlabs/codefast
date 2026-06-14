import { Slot } from "radix-ui";
import type { ComponentProps, JSX } from "react";

import { Separator } from "#/components/separator";
import { cn } from "#/lib/utils";
import type { ButtonGroupVariants } from "#/variants/button-group";
import { buttonGroupVariants } from "#/variants/button-group";

/* -----------------------------------------------------------------------------
 * Component: ButtonGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ButtonGroupProps = ComponentProps<"div"> & ButtonGroupVariants;

/**
 * @since 0.3.16-canary.0
 */
function ButtonGroup({ className, orientation, ...props }: ButtonGroupProps): JSX.Element {
  return (
    <div
      className={buttonGroupVariants({ orientation, className })}
      data-orientation={orientation}
      data-slot="button-group"
      role="group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ButtonGroupText
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
interface ButtonGroupTextProps extends ComponentProps<"div"> {
  asChild?: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
function ButtonGroupText({ asChild = false, className, ...props }: ButtonGroupTextProps): JSX.Element {
  const Component = asChild ? Slot.Root : "div";

  return (
    <Component
      className={cn(
        "flex items-center gap-2 rounded-md border bg-muted px-2.5 text-sm font-medium shadow-xs [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: ButtonGroupSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type ButtonGroupSeparatorProps = ComponentProps<typeof Separator>;

/**
 * @since 0.3.16-canary.0
 */
function ButtonGroupSeparator({
  className,
  orientation = "vertical",
  ...props
}: ButtonGroupSeparatorProps): JSX.Element {
  return (
    <Separator
      className={cn(
        "relative self-stretch bg-input data-horizontal:mx-px data-horizontal:w-auto data-vertical:my-px data-vertical:h-auto",
        className,
      )}
      data-slot="button-group-separator"
      orientation={orientation}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { ButtonGroup, ButtonGroupSeparator, ButtonGroupText };

export type { ButtonGroupProps, ButtonGroupSeparatorProps, ButtonGroupTextProps };
