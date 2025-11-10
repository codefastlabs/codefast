"use client";

import type { ComponentProps, JSX } from "react";

import type { ButtonProps } from "@/components/button";
import type { InputProps } from "@/components/input";
import type { TextareaProps } from "@/components/textarea";
import type { VariantProps } from "@codefast/tailwind-variants";

import { Button } from "@/components/button";
import { Input } from "@/components/input";
import { Textarea } from "@/components/textarea";
import { cn, tv } from "@codefast/tailwind-variants";

/* -----------------------------------------------------------------------------
 * Variants: InputGroup
 * -------------------------------------------------------------------------- */

const inputGroupVariants = tv({
  base: cn(
    "group/input-group border-input dark:bg-input/30 relative flex w-full items-center rounded-lg border shadow-xs transition-[color,box-shadow] outline-none",
    "h-9 min-w-0 has-[>textarea]:h-auto",
    "has-[>[data-align=inline-start]]:[&>[data-slot=input-group-control]]:pl-2",
    "has-[>[data-align=inline-end]]:[&>[data-slot=input-group-control]]:pr-2",
    "has-[>[data-align=block-start]]:h-auto has-[>[data-align=block-start]]:flex-col has-[>[data-align=block-start]]:[&>[data-slot=input-group-control]]:pb-3",
    "has-[>[data-align=block-end]]:h-auto has-[>[data-align=block-end]]:flex-col has-[>[data-align=block-end]]:[&>[data-slot=input-group-control]]:pt-3",
    "has-[[data-slot=input-group-control]:focus-visible]:border-ring has-[[data-slot=input-group-control]:focus-visible]:ring-ring/50 has-[[data-slot=input-group-control]:focus-visible]:ring-[3px]",
    "has-[[data-slot][aria-invalid=true]]:ring-destructive/20 has-[[data-slot][aria-invalid=true]]:border-destructive dark:has-[[data-slot][aria-invalid=true]]:ring-destructive/40",
  ),
});

/* -----------------------------------------------------------------------------
 * Variants: InputGroupAddon
 * -------------------------------------------------------------------------- */

const inputGroupAddonVariants = tv({
  base: cn(
    "text-muted-foreground flex h-auto cursor-text items-center justify-center gap-2 py-1.5 text-sm font-medium select-none [&>svg:not([class*='size-'])]:size-4 [&>kbd]:rounded-[calc(var(--radius)-5px)] group-data-[disabled=true]/input-group:opacity-50",
  ),
  defaultVariants: {
    align: "inline-start",
  },
  variants: {
    align: {
      "block-end":
        "order-last w-full justify-start px-3 pb-3 [.border-t]:pt-3 group-has-[>input]/input-group:pb-2.5",
      "block-start":
        "order-first w-full justify-start px-3 pt-3 [.border-b]:pb-3 group-has-[>input]/input-group:pt-2.5",
      "inline-end": "order-last pr-3 has-[>button]:mr-[-0.45rem] has-[>kbd]:mr-[-0.35rem]",
      "inline-start": "order-first pl-3 has-[>button]:ml-[-0.45rem] has-[>kbd]:ml-[-0.35rem]",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Variants: InputGroupButton
 * -------------------------------------------------------------------------- */

const inputGroupButtonVariants = tv({
  base: "text-sm shadow-none flex items-center gap-2 [&>svg:not([class*='size-'])]:size-4",
  defaultVariants: {
    size: "xs",
  },
  variants: {
    size: {
      "icon-sm": "size-8 p-0 has-[>svg]:p-0",
      "icon-xs": "size-6 rounded-[calc(var(--radius)-5px)] p-0 has-[>svg]:p-0",
      sm: "h-8 gap-1.5 rounded-md px-2.5 has-[>svg]:px-2.5",
      xs: "h-6 gap-1 px-2 rounded-[calc(var(--radius)-5px)] [&>svg]:size-3.5 has-[>svg]:px-2",
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: InputGroup
 * -------------------------------------------------------------------------- */

type InputGroupProps = ComponentProps<"div">;

function InputGroup({ className, ...props }: InputGroupProps): JSX.Element {
  return (
    <div
      className={inputGroupVariants({ className })}
      data-slot="input-group"
      role="group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputGroupAddon
 * -------------------------------------------------------------------------- */

type InputGroupAddonProps = ComponentProps<"div"> & VariantProps<typeof inputGroupAddonVariants>;

function InputGroupAddon({
  align = "inline-start",
  className,
  ...props
}: InputGroupAddonProps): JSX.Element {
  return (
    <div
      className={cn(inputGroupAddonVariants({ align }), className)}
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

type InputGroupButtonProps = Omit<ButtonProps, "size"> &
  VariantProps<typeof inputGroupButtonVariants>;

function InputGroupButton({
  className,
  size = "xs",
  type = "button",
  variant = "ghost",
  ...props
}: InputGroupButtonProps): JSX.Element {
  return (
    <Button
      className={cn(inputGroupButtonVariants({ size }), className)}
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

type InputGroupTextProps = ComponentProps<"span">;

function InputGroupText({ className, ...props }: InputGroupTextProps): JSX.Element {
  return (
    <span
      className={cn(
        "text-muted-foreground flex items-center gap-2 text-sm [&_svg]:pointer-events-none [&_svg:not([class*='size-'])]:size-4",
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

type InputGroupInputProps = InputProps;

function InputGroupInput({ className, ...props }: InputGroupInputProps): JSX.Element {
  return (
    <Input
      className={cn(
        "flex-1 rounded-none border-0 bg-transparent px-3 py-1 shadow-none focus-visible:ring-0 dark:bg-transparent",
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

type InputGroupTextareaProps = TextareaProps;

function InputGroupTextarea({ className, ...props }: InputGroupTextareaProps): JSX.Element {
  return (
    <Textarea
      className={cn(
        "flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 dark:bg-transparent",
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

export {
  InputGroup,
  InputGroupAddon,
  inputGroupAddonVariants,
  InputGroupButton,
  inputGroupButtonVariants,
  InputGroupInput,
  InputGroupText,
  InputGroupTextarea,
  inputGroupVariants,
};

export type {
  InputGroupAddonProps,
  InputGroupButtonProps,
  InputGroupInputProps,
  InputGroupProps,
  InputGroupTextareaProps,
  InputGroupTextProps,
};
