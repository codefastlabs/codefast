"use client";

import type { VariantProps } from "#/lib/utils";
import type { ComponentProps, JSX, ReactNode } from "react";

import { cn, tv } from "#/lib/utils";
import { useMemo } from "react";

import { Label } from "#/components/label";
import { Separator } from "#/components/separator";

/* -----------------------------------------------------------------------------
 * Variants: Field
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
const fieldVariants = tv({
  base: ["group/field flex w-full gap-3", "data-[invalid=true]:text-destructive"],
  defaultVariants: {
    orientation: "vertical",
  },
  variants: {
    orientation: {
      horizontal: [
        "flex-row items-center",
        "has-[>[data-slot=field-content]]:items-start",
        "[&>[data-slot=field-label]]:flex-auto",
        "has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
      responsive: [
        "flex-col",
        "@md/field-group:flex-row @md/field-group:items-center",
        "@md/field-group:has-[>[data-slot=field-content]]:items-start",
        "[&>*]:w-full",
        "@md/field-group:[&>*]:w-auto",
        "[&>.sr-only]:w-auto",
        "@md/field-group:[&>[data-slot=field-label]]:flex-auto",
        "@md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px",
      ],
      vertical: ["flex-col", "[&>*]:w-full", "[&>.sr-only]:w-auto"],
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: FieldSet
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldSetProps = ComponentProps<"fieldset">;

/**
 * @since 0.3.16-canary.0
 */
function FieldSet({ className, ...props }: FieldSetProps): JSX.Element {
  return (
    <fieldset
      className={cn(
        "flex flex-col gap-6",
        "has-[>[data-slot=checkbox-group]]:gap-3",
        "has-[>[data-slot=radio-group]]:gap-3",
        className,
      )}
      data-slot="field-set"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldLegend
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldLegendProps = ComponentProps<"legend"> & {
  variant?: "label" | "legend";
};

/**
 * @since 0.3.16-canary.0
 */
function FieldLegend({ className, variant = "legend", ...props }: FieldLegendProps): JSX.Element {
  return (
    <legend
      className={cn("mb-3", "text-base font-medium", "data-[variant=label]:text-sm", className)}
      data-slot="field-legend"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldGroup
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldGroupProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function FieldGroup({ className, ...props }: FieldGroupProps): JSX.Element {
  return (
    <div
      className={cn(
        "group/field-group @container/field-group flex w-full flex-col gap-7",
        "data-[slot=checkbox-group]:gap-3",
        "[&>[data-slot=field-group]]:gap-4",
        className,
      )}
      data-slot="field-group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: Field
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldProps = ComponentProps<"div"> & VariantProps<typeof fieldVariants>;

/**
 * @since 0.3.16-canary.0
 */
function Field({ className, orientation = "vertical", ...props }: FieldProps): JSX.Element {
  return (
    <div
      className={fieldVariants({ className, orientation })}
      data-orientation={orientation}
      data-slot="field"
      role="group"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldContent
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldContentProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function FieldContent({ className, ...props }: FieldContentProps): JSX.Element {
  return (
    <div
      className={cn("group/field-content flex flex-1 flex-col gap-1.5", "leading-snug", className)}
      data-slot="field-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldLabel
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldLabelProps = ComponentProps<typeof Label>;

/**
 * @since 0.3.16-canary.0
 */
function FieldLabel({ className, ...props }: FieldLabelProps): JSX.Element {
  return (
    <Label
      className={cn(
        "group/field-label peer/field-label flex w-fit gap-2 leading-snug",
        "group-data-disabled/field:opacity-50",
        "has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border",
        "has-data-checked:border-primary has-data-checked:bg-primary/5",
        "dark:has-data-checked:bg-primary/10",
        "[&>*]:data-[slot=field]:p-4",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldTitle
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldTitleProps = ComponentProps<"div">;

/**
 * @since 0.3.16-canary.0
 */
function FieldTitle({ className, ...props }: FieldTitleProps): JSX.Element {
  return (
    <div
      className={cn(
        "flex w-fit items-center gap-2 text-sm leading-snug font-medium",
        "group-data-disabled/field:opacity-50",
        className,
      )}
      data-slot="field-label"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldDescription
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldDescriptionProps = ComponentProps<"p">;

/**
 * @since 0.3.16-canary.0
 */
function FieldDescription({ className, ...props }: FieldDescriptionProps): JSX.Element {
  return (
    <p
      className={cn(
        "text-sm leading-normal font-normal text-muted-foreground",
        "group-has-data-[orientation=horizontal]/field:text-balance",
        "last:mt-0",
        "nth-last-2:-mt-1",
        "[&>a]:underline [&>a]:underline-offset-4",
        "[&>a:hover]:text-primary",
        "[[data-variant=legend]+&]:-mt-1.5",
        className,
      )}
      data-slot="field-description"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldSeparator
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type FieldSeparatorProps = ComponentProps<"div"> & {
  children?: ComponentProps<"span">["children"];
};

/**
 * @since 0.3.16-canary.0
 */
function FieldSeparator({ children, className, ...props }: FieldSeparatorProps): JSX.Element {
  const hasContent = Boolean(children);

  return (
    <div
      className={cn(
        "relative",
        "-my-2 h-5 text-sm",
        "group-data-[variant=outline]/field-group:-mb-2",
        className,
      )}
      data-content={hasContent}
      data-slot="field-separator"
      {...props}
    >
      <Separator className={cn("absolute", "inset-0 top-1/2")} />
      {hasContent ? (
        <span
          className={cn(
            "relative block",
            "mx-auto w-fit px-2",
            "bg-background text-muted-foreground",
          )}
          data-slot="field-separator-content"
        >
          {children}
        </span>
      ) : null}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldError
 * -------------------------------------------------------------------------- */

interface FieldErrorMessage {
  message?: string;
}

/**
 * @since 0.3.16-canary.0
 */
interface FieldErrorProps extends ComponentProps<"div"> {
  errors?: Array<FieldErrorMessage | undefined>;
}

/**
 * @since 0.3.16-canary.0
 */
function FieldError({
  children,
  className,
  errors,
  ...props
}: FieldErrorProps): JSX.Element | null {
  const fallbackContent = useMemo<null | ReactNode>(() => {
    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message ?? null;
    }

    return (
      <ul className={cn("flex flex-col gap-1", "ml-4", "list-disc")}>
        {uniqueErrors.map((error) =>
          error?.message ? <li key={error.message}>{error.message}</li> : null,
        )}
      </ul>
    );
  }, [errors]);

  const content = children ?? fallbackContent;

  if (content === null || content === undefined || content === false) {
    return null;
  }

  return (
    <div
      className={cn("text-sm font-normal text-destructive", className)}
      data-slot="field-error"
      role="alert"
      {...props}
    >
      {content}
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
  FieldTitle,
  fieldVariants,
};

export type {
  FieldContentProps,
  FieldDescriptionProps,
  FieldErrorProps,
  FieldGroupProps,
  FieldLabelProps,
  FieldLegendProps,
  FieldProps,
  FieldSeparatorProps,
  FieldSetProps,
  FieldTitleProps,
};
