'use client';

import { createContextScope, type Scope } from '@radix-ui/react-context';
import { Slot } from '@radix-ui/react-slot';
import { result } from 'lodash-es';
import {
  type ComponentProps,
  type ComponentPropsWithoutRef,
  type ComponentRef,
  forwardRef,
  type HTMLAttributes,
  type JSX,
  useId,
} from 'react';
import {
  Controller,
  type ControllerProps,
  type FieldPath,
  type FieldValues,
  FormProvider,
  type GlobalError,
  useFormState,
} from 'react-hook-form';

import { Label } from '@/components/label';
import { cn } from '@/lib/utils';

import type * as LabelPrimitive from '@radix-ui/react-label';

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
>(formFieldProps: FormFieldProps<TFieldValues, TName>): JSX.Element {
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
type FormItemProps = HTMLAttributes<HTMLDivElement>;

const FormItem = forwardRef<FormItemElement, FormItemProps>(
  ({ __scopeFormField, className, ...props }: ScopedProps<FormItemProps>, forwardedRef) => {
    const id = useId();

    return (
      <FormItemProvider id={id} scope={__scopeFormField}>
        <div ref={forwardedRef} className={cn('grid gap-2', className)} {...props} />
      </FormItemProvider>
    );
  },
);

FormItem.displayName = FORM_ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Component: FormLabel
 * -------------------------------------------------------------------------- */

const FORM_LABEL_NAME = 'FormLabel';

type FormFieldElement = ComponentRef<typeof LabelPrimitive.Root>;
type FormLabelProps = ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

const FormLabel = forwardRef<FormFieldElement, FormLabelProps>(
  ({ __scopeFormField, ...props }: ScopedProps<FormLabelProps>, forwardedRef) => {
    const { formItemId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);

    return <Label ref={forwardedRef} htmlFor={formItemId} {...props} />;
  },
);

FormLabel.displayName = FORM_LABEL_NAME;

/* -----------------------------------------------------------------------------
 * Component: FormControl
 * -------------------------------------------------------------------------- */

const FORM_CONTROL_NAME = 'FormControl';

type FormControlElement = ComponentRef<typeof Slot>;
type FormControlProps = ComponentPropsWithoutRef<typeof Slot>;

const FormControl = forwardRef<FormControlElement, FormControlProps>(
  ({ __scopeFormField, ...props }: ScopedProps<FormControlProps>, forwardedRef) => {
    const { formDescriptionId, formItemId, formMessageId } = useFormItem(FORM_MESSAGE_NAME, __scopeFormField);
    const { name } = useFormFieldContext(FORM_CONTROL_NAME, __scopeFormField);
    const { errors } = useFormState({ name });

    return (
      <Slot
        ref={forwardedRef}
        aria-describedby={errors[name] ? `${formDescriptionId} ${formMessageId}` : formDescriptionId}
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
type FormDescriptionProps = HTMLAttributes<HTMLParagraphElement>;

const FormDescription = forwardRef<FormDescriptionElement, FormDescriptionProps>(
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
type FormMessageProps = HTMLAttributes<HTMLParagraphElement>;

const FormMessage = forwardRef<FormMessageElement, FormMessageProps>(
  ({ __scopeFormField, children, className, ...props }: ScopedProps<FormMessageProps>, forwardedRef) => {
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
        ref={forwardedRef}
        className={cn('text-xs', error?.message ? 'text-destructive font-medium' : 'text-muted-foreground', className)}
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
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  type FormControlProps,
  type FormDescriptionProps,
  type FormFieldProps,
  type FormItemProps,
  type FormLabelProps,
  type FormMessageProps,
  type FormProps,
};
