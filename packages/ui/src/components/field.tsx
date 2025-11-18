'use client';

import type { ComponentProps, JSX, ReactNode } from 'react';

import { useMemo } from 'react';

import type { VariantProps } from '@codefast/tailwind-variants';

import { Label } from '@/components/label';
import { Separator } from '@/components/separator';
import { cn, tv } from '@codefast/tailwind-variants';

/* -----------------------------------------------------------------------------
 * Variants: Field
 * -------------------------------------------------------------------------- */

const fieldVariants = tv({
  base: 'group/field flex w-full gap-3 data-[invalid=true]:text-destructive',
  defaultVariants: {
    orientation: 'vertical',
  },
  variants: {
    orientation: {
      horizontal: cn(
        'flex-row items-center',
        '[&>[data-slot=field-label]]:flex-auto',
        'has-[>[data-slot=field-content]]:items-start has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      ),
      responsive: cn(
        'flex-col [&>*]:w-full [&>.sr-only]:w-auto',
        '@md/field-group:flex-row @md/field-group:items-center @md/field-group:[&>*]:w-auto',
        '@md/field-group:[&>[data-slot=field-label]]:flex-auto',
        '@md/field-group:has-[>[data-slot=field-content]]:items-start @md/field-group:has-[>[data-slot=field-content]]:[&>[role=checkbox],[role=radio]]:mt-px',
      ),
      vertical: 'flex-col [&>*]:w-full [&>.sr-only]:w-auto',
    },
  },
});

/* -----------------------------------------------------------------------------
 * Component: FieldSet
 * -------------------------------------------------------------------------- */

type FieldSetProps = ComponentProps<'fieldset'>;

function FieldSet({ className, ...props }: FieldSetProps): JSX.Element {
  return (
    <fieldset
      className={cn(
        'flex flex-col gap-6',
        'has-[>[data-slot=checkbox-group]]:gap-3 has-[>[data-slot=radio-group]]:gap-3',
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

type FieldLegendProps = ComponentProps<'legend'> & {
  variant?: 'label' | 'legend';
};

function FieldLegend({ className, variant = 'legend', ...props }: FieldLegendProps): JSX.Element {
  return (
    <legend
      className={cn('mb-3 text-base font-medium', 'data-[variant=label]:text-sm', className)}
      data-slot="field-legend"
      data-variant={variant}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldGroup
 * -------------------------------------------------------------------------- */

type FieldGroupProps = ComponentProps<'div'>;

function FieldGroup({ className, ...props }: FieldGroupProps): JSX.Element {
  return (
    <div
      className={cn(
        'group/field-group @container/field-group flex w-full flex-col gap-7 data-[slot=checkbox-group]:gap-3 [&>[data-slot=field-group]]:gap-4',
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

type FieldProps = ComponentProps<'div'> & VariantProps<typeof fieldVariants>;

function Field({ className, orientation = 'vertical', ...props }: FieldProps): JSX.Element {
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

type FieldContentProps = ComponentProps<'div'>;

function FieldContent({ className, ...props }: FieldContentProps): JSX.Element {
  return (
    <div
      className={cn('group/field-content flex flex-1 flex-col gap-1.5 leading-snug', className)}
      data-slot="field-content"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: FieldLabel
 * -------------------------------------------------------------------------- */

type FieldLabelProps = ComponentProps<typeof Label>;

function FieldLabel({ className, ...props }: FieldLabelProps): JSX.Element {
  return (
    <Label
      className={cn(
        'group/field-label peer/field-label flex w-fit gap-2 leading-snug group-data-[disabled=true]/field:opacity-50',
        'has-[>[data-slot=field]]:w-full has-[>[data-slot=field]]:flex-col has-[>[data-slot=field]]:rounded-lg has-[>[data-slot=field]]:border [&>*]:data-[slot=field]:p-4',
        'has-data-[state=checked]:border-primary has-data-[state=checked]:bg-primary/5 dark:has-data-[state=checked]:bg-primary/10',
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

type FieldTitleProps = ComponentProps<'div'>;

function FieldTitle({ className, ...props }: FieldTitleProps): JSX.Element {
  return (
    <div
      className={cn(
        'flex w-fit items-center gap-2 text-sm leading-snug font-medium group-data-[disabled=true]/field:opacity-50',
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

type FieldDescriptionProps = ComponentProps<'p'>;

function FieldDescription({ className, ...props }: FieldDescriptionProps): JSX.Element {
  return (
    <p
      className={cn(
        'text-muted-foreground text-sm leading-normal font-normal group-has-[[data-orientation=horizontal]]/field:text-balance',
        'last:mt-0 nth-last-2:-mt-1 [[data-variant=legend]+&]:-mt-1.5',
        '[&>a:hover]:text-primary [&>a]:underline [&>a]:underline-offset-4',
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

type FieldSeparatorProps = ComponentProps<'div'> & {
  children?: ComponentProps<'span'>['children'];
};

function FieldSeparator({ children, className, ...props }: FieldSeparatorProps): JSX.Element {
  const hasContent = Boolean(children);

  return (
    <div
      className={cn('relative -my-2 h-5 text-sm group-data-[variant=outline]/field-group:-mb-2', className)}
      data-content={hasContent}
      data-slot="field-separator"
      {...props}
    >
      <Separator className="absolute inset-0 top-1/2" />
      {hasContent ? (
        <span
          className="bg-background text-muted-foreground relative mx-auto block w-fit px-2"
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

interface FieldErrorProps extends ComponentProps<'div'> {
  errors?: (FieldErrorMessage | undefined)[];
}

function FieldError({ children, className, errors, ...props }: FieldErrorProps): JSX.Element | null {
  const fallbackContent = useMemo<null | ReactNode>(() => {
    if (!errors?.length) {
      return null;
    }

    const uniqueErrors = [...new Map(errors.map((error) => [error?.message, error])).values()];

    if (uniqueErrors.length === 1) {
      return uniqueErrors[0]?.message ?? null;
    }

    return (
      <ul className="ml-4 flex list-disc flex-col gap-1">
        {uniqueErrors.map((error) => (error?.message ? <li key={error.message}>{error.message}</li> : null))}
      </ul>
    );
  }, [errors]);

  const content = children ?? fallbackContent;

  if (content === null || content === undefined || content === false) {
    return null;
  }

  return (
    <div
      className={cn('text-destructive text-sm font-normal', className)}
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
