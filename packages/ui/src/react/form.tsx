'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  useFormState,
} from 'react-hook-form';
import type * as LabelPrimitive from '@radix-ui/react-label';
import { createContextScope, type Scope } from '@radix-ui/react-context';
import { cn } from '@/lib/utils';
import { Label } from '@/react/label';

/* -----------------------------------------------------------------------------
 * Component: Form
 * -------------------------------------------------------------------------- */

type FormProps = React.ComponentProps<typeof FormProvider>;
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

const [FormFieldProvider, useFormFieldContext] = createFormFieldContext<FormFieldContextValue>(FORM_FIELD_NAME);

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
    formDescriptionId: `form-item-description-${id}`,
    formItemId: `form-item-${id}`,
    formMessageId: `form-item-message-${id}`,
    id,
  };
}

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ControllerProps<TFieldValues, TName>;

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>(formFieldProps: FormFieldProps<TFieldValues, TName>): React.JSX.Element {
  const { __scopeFormField, ...props } = formFieldProps as ScopedProps<FormFieldProps<TFieldValues, TName>>;

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

const [FormItemProvider, useFormItemContext] = createFormFieldContext<FormItemContextValue>(FORM_ITEM_NAME);

type FormItemElement = HTMLDivElement;
type FormItemProps = React.HTMLAttributes<HTMLDivElement>;

const FormItem = React.forwardRef<FormItemElement, FormItemProps>(
  ({ __scopeFormField, className, ...props }: ScopedProps<FormItemProps>, forwardedRef) => {
    const id = React.useId();

    return (
      <FormItemProvider id={id} scope={__scopeFormField}>
        <div ref={forwardedRef} className={cn('space-y-2', className)} {...props} />
      </FormItemProvider>
    );
  },
);

FormItem.displayName = FORM_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Component: FormLabel
 * -------------------------------------------------------------------------- */

const FORM_LABEL_NAME = 'FormLabel';

type FormFieldElement = React.ElementRef<typeof LabelPrimitive.Root>;
type FormLabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

const FormLabel = React.forwardRef<FormFieldElement, FormLabelProps>(
  ({ __scopeFormField, className, ...props }: ScopedProps<FormLabelProps>, forwardedRef) => {
    const { formItemId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);
    const { name } = useFormFieldContext(FORM_LABEL_NAME, __scopeFormField);
    const { errors } = useFormState({ name });

    return (
      <Label
        ref={forwardedRef}
        className={cn(errors[name] && 'text-destructive', className)}
        htmlFor={formItemId}
        {...props}
      />
    );
  },
);

FormLabel.displayName = FORM_LABEL_NAME;

/* -----------------------------------------------------------------------------
 * Component: FormControl
 * -------------------------------------------------------------------------- */

const FORM_CONTROL_NAME = 'FormControl';

type FormControlElement = React.ElementRef<typeof Slot>;
type FormControlProps = React.ComponentPropsWithoutRef<typeof Slot>;

const FormControl = React.forwardRef<FormControlElement, FormControlProps>(
  ({ __scopeFormField, ...props }: ScopedProps<FormControlProps>, forwardedRef) => {
    const { formItemId, formDescriptionId, formMessageId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);
    const { name } = useFormFieldContext(FORM_CONTROL_NAME, __scopeFormField);
    const { errors } = useFormState({ name });

    return (
      <Slot
        ref={forwardedRef}
        aria-describedby={!errors[name] ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
        aria-invalid={Boolean(errors[name])}
        id={formItemId}
        {...props}
      />
    );
  },
);

FormControl.displayName = FORM_CONTROL_NAME;

/* -----------------------------------------------------------------------------
 * Component: FormDescription
 * -------------------------------------------------------------------------- */

const FORM_DESCRIPTION_NAME = 'FormDescription';

type FormDescriptionElement = HTMLParagraphElement;
type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormDescription = React.forwardRef<FormDescriptionElement, FormDescriptionProps>(
  ({ __scopeFormField, className, ...props }: ScopedProps<FormDescriptionProps>, forwardedRef) => {
    const { formDescriptionId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);

    return (
      <p
        ref={forwardedRef}
        className={cn('text-muted-foreground text-xs', className)}
        id={formDescriptionId}
        {...props}
      />
    );
  },
);

FormDescription.displayName = FORM_DESCRIPTION_NAME;

/* -----------------------------------------------------------------------------
 * Component: FormMessage
 * -------------------------------------------------------------------------- */

const FORM_MESSAGE_NAME = 'FormMessage';

type FormMessageElement = HTMLParagraphElement;
type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormMessage = React.forwardRef<FormMessageElement, FormMessageProps>(
  ({ __scopeFormField, children, className, ...props }: ScopedProps<FormMessageProps>, forwardedRef) => {
    const { formMessageId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);
    const { name } = useFormFieldContext(FORM_MESSAGE_NAME, __scopeFormField);
    const { errors } = useFormState({ name });
    const body = errors[name]?.message ? String(errors[name].message) : children;

    if (!body) {
      return null;
    }

    return (
      <p
        ref={forwardedRef}
        className={cn(
          'text-xs',
          errors[name]?.message ? 'text-destructive font-medium' : 'text-muted-foreground',
          className,
        )}
        id={formMessageId}
        {...props}
      >
        {body}
      </p>
    );
  },
);

FormMessage.displayName = FORM_MESSAGE_NAME;

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  createFormFieldScope,
  Form,
  FormItem,
  FormLabel,
  FormControl,
  FormDescription,
  FormMessage,
  FormField,
  type FormProps,
  type FormItemProps,
  type FormLabelProps,
  type FormControlProps,
  type FormDescriptionProps,
  type FormMessageProps,
  type FormFieldProps,
};
