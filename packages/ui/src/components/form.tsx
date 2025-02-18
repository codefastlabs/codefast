'use client';

import type { Scope } from '@radix-ui/react-context';
import type * as LabelPrimitive from '@radix-ui/react-label';
import type { ComponentProps, JSX, ReactNode } from 'react';
import type { ControllerProps, FieldPath, FieldValues, GlobalError } from 'react-hook-form';

import { createContextScope } from '@radix-ui/react-context';
import { Slot } from '@radix-ui/react-slot';
import { result } from 'lodash-es';
import { useId } from 'react';
import { Controller, FormProvider, useFormState } from 'react-hook-form';

import { Label } from '@/components/label';
import { cn } from '@/lib/utils';

/* -----------------------------------------------------------------------------
 * Component: Form
 * -------------------------------------------------------------------------- */

type FormProps = ComponentProps<typeof FormProvider>;
const Form = FormProvider;

/* -----------------------------------------------------------------------------
 * Component: FormField
 * -------------------------------------------------------------------------- */

const FORM_FIELD_NAME = 'FormField';

type ScopedProps<P> = P & { __scopeFormField?: Scope };

const [createFormFieldContext, createFormFieldScope] = createContextScope(FORM_FIELD_NAME);

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

const [FormFieldProvider, useFormFieldContext] =
  createFormFieldContext<FormFieldContextValue>(FORM_FIELD_NAME);

function useFormItem(
  consumerName: string,
  scope: Scope,
): {
  formDescriptionId: string;
  formItemId: string;
  formMessageId: string;
  id: string;
} {
  const { id } = useFormItemContext(consumerName, scope);

  return {
    id,
    formDescriptionId: `form-item-description-${id}`,
    formItemId: `form-item-${id}`,
    formMessageId: `form-item-message-${id}`,
  };
}

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ControllerProps<TFieldValues, TName>;

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(formFieldProps: FormFieldProps<TFieldValues, TName>): JSX.Element {
  const { __scopeFormField, ...props } = formFieldProps as ScopedProps<
    FormFieldProps<TFieldValues, TName>
  >;

  return (
    <FormFieldProvider name={props.name} scope={__scopeFormField}>
      <Controller {...props} />
    </FormFieldProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: FormItem
 * -------------------------------------------------------------------------- */

const FORM_ITEM_NAME = 'FormItem';

interface FormItemContextValue {
  id: string;
}

const [FormItemProvider, useFormItemContext] =
  createFormFieldContext<FormItemContextValue>(FORM_ITEM_NAME);

type FormItemProps = ComponentProps<'div'>;

function FormItem({
  __scopeFormField,
  className,
  ...props
}: ScopedProps<FormItemProps>): JSX.Element {
  const id = useId();

  return (
    <FormItemProvider id={id} scope={__scopeFormField}>
      <div className={cn('space-y-2', className)} {...props} />
    </FormItemProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: FormLabel
 * -------------------------------------------------------------------------- */

type FormLabelProps = ComponentProps<typeof LabelPrimitive.Root>;

function FormLabel({ __scopeFormField, ...props }: ScopedProps<FormLabelProps>): JSX.Element {
  const { formItemId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);

  return <Label htmlFor={formItemId} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Component: FormControl
 * -------------------------------------------------------------------------- */

const FORM_CONTROL_NAME = 'FormControl';

type FormControlProps = ComponentProps<typeof Slot>;

function FormControl({ __scopeFormField, ...props }: ScopedProps<FormControlProps>): JSX.Element {
  const { formDescriptionId, formItemId, formMessageId } = useFormItem(
    FORM_MESSAGE_NAME,
    __scopeFormField,
  );
  const { name } = useFormFieldContext(FORM_CONTROL_NAME, __scopeFormField);
  const { errors } = useFormState({ name });

  return (
    <Slot
      aria-describedby={errors[name] ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
      aria-invalid={Boolean(errors[name])}
      id={formItemId}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FormDescription
 * -------------------------------------------------------------------------- */

type FormDescriptionProps = ComponentProps<'p'>;

function FormDescription({
  __scopeFormField,
  className,
  ...props
}: ScopedProps<FormDescriptionProps>): JSX.Element {
  const { formDescriptionId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);

  return (
    <p
      className={cn('text-muted-foreground text-xs', className)}
      id={formDescriptionId}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FormMessage
 * -------------------------------------------------------------------------- */

const FORM_MESSAGE_NAME = 'FormMessage';

type FormMessageProps = ComponentProps<'p'>;

function FormMessage({
  __scopeFormField,
  children,
  className,
  ...props
}: ScopedProps<FormMessageProps>): ReactNode {
  const { formMessageId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);
  const { name } = useFormFieldContext(FORM_MESSAGE_NAME, __scopeFormField);
  const { errors } = useFormState({ name });
  const error = result<GlobalError | null>(errors, name);
  const body = error?.message ? String(error.message) : children;

  if (!body) {
    return null;
  }

  return (
    <p
      className={cn(
        'text-xs',
        error?.message ? 'text-destructive font-medium' : 'text-muted-foreground',
        className,
      )}
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

export type {
  FormControlProps,
  FormDescriptionProps,
  FormFieldProps,
  FormItemProps,
  FormLabelProps,
  FormMessageProps,
  FormProps,
};
export {
  createFormFieldScope,
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
};
