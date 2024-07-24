'use client';

import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import {
  Controller,
  type ControllerProps,
  type FieldError,
  type FieldErrorsImpl,
  type FieldPath,
  type FieldValues,
  FormProvider,
  type Merge,
  useFormContext,
} from 'react-hook-form';
import type * as LabelPrimitive from '@radix-ui/react-label';
import { cn } from '@/lib/utils';
import { Label } from '@/react/label';

/* -----------------------------------------------------------------------------
 * Context: Form
 * -------------------------------------------------------------------------- */

interface FormFieldContextValue<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> {
  name: TName;
}

interface FormItemContextValue {
  id: string;
}

const FormFieldContext = React.createContext<FormFieldContextValue | null>(null);

const FormItemContext = React.createContext<FormItemContextValue | null>(null);

const useFormField = (): {
  formDescriptionId: string;
  formItemId: string;
  formMessageId: string;
  id: string;
  invalid: boolean;
  isDirty: boolean;
  isTouched: boolean;
  isValidating: boolean;
  name: string;
  error?: FieldError | Merge<FieldError, FieldErrorsImpl> | undefined;
} => {
  const fieldContext = React.useContext(FormFieldContext);
  const itemContext = React.useContext(FormItemContext);
  const { getFieldState, formState } = useFormContext();

  if (!fieldContext || !itemContext) {
    throw new Error('useFormField should be used within <FormField>');
  }

  const fieldState = getFieldState(fieldContext.name, formState);

  const { id } = itemContext;

  return {
    id,
    name: fieldContext.name,
    formItemId: `form-item-${id}`,
    formDescriptionId: `form-item-description-${id}`,
    formMessageId: `form-item-message-${id}`,
    ...fieldState,
  };
};

/* -----------------------------------------------------------------------------
 * Component: Form
 * -------------------------------------------------------------------------- */

type FormProps = React.ComponentProps<typeof FormProvider>;
const Form = FormProvider;

/* -----------------------------------------------------------------------------
 * Component: FormField
 * -------------------------------------------------------------------------- */

type FormFieldProps<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
> = ControllerProps<TFieldValues, TName>;

function FormField<
  TFieldValues extends FieldValues = FieldValues,
  TName extends FieldPath<TFieldValues> = FieldPath<TFieldValues>,
>({ ...props }: FormFieldProps<TFieldValues, TName>): React.JSX.Element {
  return (
    <FormFieldContext.Provider value={{ name: props.name }}>
      <Controller {...props} />
    </FormFieldContext.Provider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: FormItem
 * -------------------------------------------------------------------------- */

type FormItemElement = HTMLDivElement;
type FormItemProps = React.HTMLAttributes<HTMLDivElement>;

const FormItem = React.forwardRef<FormItemElement, FormItemProps>(({ className, ...props }, forwardedRef) => {
  const id = React.useId();

  return (
    <FormItemContext.Provider value={{ id }}>
      <div ref={forwardedRef} className={cn('space-y-2', className)} {...props} />
    </FormItemContext.Provider>
  );
});

FormItem.displayName = 'FormItem';

/* -----------------------------------------------------------------------------
 * Component: FormLabel
 * -------------------------------------------------------------------------- */

type FormFieldElement = React.ElementRef<typeof LabelPrimitive.Root>;
type FormLabelProps = React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root>;

const FormLabel = React.forwardRef<FormFieldElement, FormLabelProps>(({ className, ...props }, forwardedRef) => {
  const { error, formItemId } = useFormField();

  return (
    <Label ref={forwardedRef} className={cn(error && 'text-destructive', className)} htmlFor={formItemId} {...props} />
  );
});

FormLabel.displayName = 'FormLabel';

/* -----------------------------------------------------------------------------
 * Component: FormControl
 * -------------------------------------------------------------------------- */

type FormControlElement = React.ElementRef<typeof Slot>;
type FormControlProps = React.ComponentPropsWithoutRef<typeof Slot>;

const FormControl = React.forwardRef<FormControlElement, FormControlProps>(({ ...props }, forwardedRef) => {
  const { error, formItemId, formDescriptionId, formMessageId } = useFormField();

  return (
    <Slot
      ref={forwardedRef}
      aria-describedby={!error ? formDescriptionId : `${formDescriptionId} ${formMessageId}`}
      aria-invalid={Boolean(error)}
      id={formItemId}
      {...props}
    />
  );
});

FormControl.displayName = 'FormControl';

/* -----------------------------------------------------------------------------
 * Component: FormDescription
 * -------------------------------------------------------------------------- */

type FormDescriptionElement = HTMLParagraphElement;
type FormDescriptionProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormDescription = React.forwardRef<FormDescriptionElement, FormDescriptionProps>(
  ({ className, ...props }, forwardedRef) => {
    const { formDescriptionId } = useFormField();

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

FormDescription.displayName = 'FormDescription';

/* -----------------------------------------------------------------------------
 * Component: FormMessage
 * -------------------------------------------------------------------------- */

type FormMessageElement = HTMLParagraphElement;
type FormMessageProps = React.HTMLAttributes<HTMLParagraphElement>;

const FormMessage = React.forwardRef<FormMessageElement, FormMessageProps>(
  ({ children, className, ...props }, forwardedRef) => {
    const { error, formMessageId } = useFormField();
    const body = error?.message ? String(error.message) : children;

    if (!body) {
      return null;
    }

    return (
      <p
        ref={forwardedRef}
        className={cn('text-destructive text-xs font-medium', className)}
        id={formMessageId}
        {...props}
      >
        {body}
      </p>
    );
  },
);

FormMessage.displayName = 'FormMessage';

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  useFormField,
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
