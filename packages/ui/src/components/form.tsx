"use client";

import type { Scope } from "@radix-ui/react-context";
import type * as LabelPrimitive from "@radix-ui/react-label";
import type { ComponentProps, JSX, ReactNode } from "react";
import type { ControllerProps, FieldError, FieldPath, FieldValues } from "react-hook-form";

import { createContextScope } from "@radix-ui/react-context";
import { Slot } from "@radix-ui/react-slot";
import { useId } from "react";
import { Controller, FormProvider, useFormContext, useFormState } from "react-hook-form";

import { Label } from "@/components/label";
import { cn } from "@/lib/utils";

/* -----------------------------------------------------------------------------
 * Component: Form
 * -------------------------------------------------------------------------- */

const Form = FormProvider;

/* -----------------------------------------------------------------------------
 * Context: FormField
 * -------------------------------------------------------------------------- */

const FORM_FIELD_NAME = "FormField";

type ScopedProps<P> = P & { __scopeFormField?: Scope };

const [createFormFieldContext, createFormFieldScope] = createContextScope(FORM_FIELD_NAME);

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const [FormFieldContextProvider, useFormFieldContext] = createFormFieldContext<FormFieldContextValue>(FORM_FIELD_NAME);

function useFormItem(
  consumerName: string,
  scope: Scope,
): {
  formDescriptionId: string;
  formItemId: string;
  formMessageId: string;
  id: string;
  invalid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  name: string;
  error?: FieldError;
} {
  const { id } = useFormItemContext(consumerName, scope);
  const { name } = useFormFieldContext(consumerName, scope);
  const { getFieldState } = useFormContext();
  const formState = useFormState({ name });
  const fieldState = getFieldState(name, formState);

  return {
    id,
    name,
    formDescriptionId: `form-item-description-${id}`,
    formItemId: `form-item-${id}`,
    formMessageId: `form-item-message-${id}`,
    ...fieldState,
  };
}

/* -----------------------------------------------------------------------------
 * Component: FormField
 * -------------------------------------------------------------------------- */

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(formFieldProps: ScopedProps<ControllerProps<TFieldValues, TName>>): JSX.Element {
  const { __scopeFormField, ...props } = formFieldProps;

  return (
    <FormFieldContextProvider name={props.name} scope={__scopeFormField}>
      <Controller {...props} />
    </FormFieldContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Context: FormItem
 * -------------------------------------------------------------------------- */

const FORM_ITEM_NAME = "FormItem";

interface FormItemContextValue {
  id: string;
}

const [FormItemContextProvider, useFormItemContext] = createFormFieldContext<FormItemContextValue>(FORM_ITEM_NAME);

/* -----------------------------------------------------------------------------
 * Component: FormItem
 * -------------------------------------------------------------------------- */

function FormItem({ __scopeFormField, className, ...props }: ScopedProps<ComponentProps<"div">>): JSX.Element {
  const id = useId();

  return (
    <FormItemContextProvider id={id} scope={__scopeFormField}>
      <div className={cn("grid gap-2", className)} data-slot="form-item" {...props} />
    </FormItemContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: FormLabel
 * -------------------------------------------------------------------------- */

const FORM_LABEL_NAME = "FormLabel";

function FormLabel({
  __scopeFormField,
  ...props
}: ScopedProps<ComponentProps<typeof LabelPrimitive.Root>>): JSX.Element {
  const { formItemId, error } = useFormItem(FORM_LABEL_NAME, __scopeFormField);

  return <Label data-invalid={error ? true : undefined} data-slot="form-label" htmlFor={formItemId} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: FormControl
 * -------------------------------------------------------------------------- */

const FORM_CONTROL_NAME = "FormControl";

function FormControl({ __scopeFormField, ...props }: ScopedProps<ComponentProps<typeof Slot>>): JSX.Element {
  const { formDescriptionId, formItemId, formMessageId, error } = useFormItem(FORM_CONTROL_NAME, __scopeFormField);

  return (
    <Slot
      aria-describedby={error ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={Boolean(error)}
      data-slot="form-control"
      id={formItemId}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FormDescription
 * -------------------------------------------------------------------------- */

function FormDescription({ __scopeFormField, className, ...props }: ScopedProps<ComponentProps<"p">>): JSX.Element {
  const { formDescriptionId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);

  return (
    <p
      className={cn("text-muted-foreground text-xs", className)}
      data-slot="form-description"
      id={formDescriptionId}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FormMessage
 * -------------------------------------------------------------------------- */

const FORM_MESSAGE_NAME = "FormMessage";

function FormMessage({ __scopeFormField, children, className, ...props }: ScopedProps<ComponentProps<"p">>): ReactNode {
  const { formMessageId, error } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);
  const body = error?.message ? String(error.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      className={cn("text-xs", error?.message ? "text-destructive font-medium" : "text-muted-foreground", className)}
      data-slot="form-message"
      id={formMessageId}
      {...props}
    >
      {body}
    </p>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { createFormFieldScope, Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage };
