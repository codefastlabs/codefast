import type { ComponentProps, JSX } from "react";

import type { ButtonProps } from "#/components/button";
import { Button } from "#/components/button";
import type { InputProps } from "#/components/input";
import { Input } from "#/components/input";
import type { TextareaProps } from "#/components/textarea";
import { Textarea } from "#/components/textarea";
import { cn } from "#/lib/utils";
import type { InputGroupAddonVariants, InputGroupButtonVariants } from "#/variants/input-group";
import { inputGroupAddonVariants, inputGroupButtonVariants, inputGroupVariants } from "#/variants/input-group";

/* -----------------------------------------------------------------------------
 * Component: InputGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputGroupProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function InputGroup({ className, ...props }: InputGroupProps): JSX.Element {
  return <div className={inputGroupVariants({ className })} data-slot="input-group" role="group" {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: InputGroupAddon
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputGroupAddonProps = ComponentProps<"div"> & InputGroupAddonVariants;

/**
 * @since 0.3.16-canary.0
 */
function InputGroupAddon({ align = "inline-start", className, ...props }: InputGroupAddonProps): JSX.Element {
  return (
    <div
      className={inputGroupAddonVariants({ align, className })}
      data-align={align}
      data-slot="input-group-addon"
      role="group"
      onPointerDown={(event) => {
        if ((event.target as HTMLElement).closest("button")) {
          return;
        }

        event.preventDefault();

        const control = event.currentTarget.parentElement?.querySelector("input, textarea");

        if (control instanceof HTMLElement) {
          control.focus();
        }
      }}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputGroupButton
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputGroupButtonProps = Omit<ButtonProps, "size"> & InputGroupButtonVariants;

/**
 * @since 0.3.16-canary.0
 */
function InputGroupButton({
  className,
  size = "xs",
  type = "button",
  variant = "ghost",
  ...props
}: InputGroupButtonProps): JSX.Element {
  return (
    <Button
      className={inputGroupButtonVariants({ size, className })}
      data-size={size}
      data-slot="input-group-button"
      type={type}
      variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputGroupText
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputGroupTextProps = ComponentProps<"span">;

/**
 * @since 0.3.16-canary.0
 */
function InputGroupText({ className, ...props }: InputGroupTextProps): JSX.Element {
  return (
    <span
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="input-group-text"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputGroupInput
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputGroupInputProps = InputProps;

/**
 * @since 0.3.16-canary.0
 */
function InputGroupInput({ className, ...props }: InputGroupInputProps): JSX.Element {
  return (
    <Input
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
        className,
      )}
      data-slot="input-group-control"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputGroupTextarea
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputGroupTextareaProps = TextareaProps;

/**
 * @since 0.3.16-canary.0
 */
function InputGroupTextarea({ className, ...props }: InputGroupTextareaProps): JSX.Element {
  return (
    <Textarea
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-2 shadow-none ring-0 focus-visible:ring-0 aria-invalid:ring-0 dark:bg-transparent",
        className,
      )}
      data-slot="input-group-control"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput, InputGroupText, InputGroupTextarea };

export type {
  InputGroupAddonProps,
  InputGroupButtonProps,
  InputGroupInputProps,
  InputGroupProps,
  InputGroupTextareaProps,
  InputGroupTextProps,
};
