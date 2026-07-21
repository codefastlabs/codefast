import { ChevronDownIcon, ChevronUpIcon, MinusIcon, PlusIcon } from "lucide-react";
import type { ComponentProps, JSX } from "react";

import { Spinner } from "#/components/spinner";
import { cn } from "#/lib/utils";
import * as InputNumberPrimitive from "#/primitives/input-number";
import { buttonVariants } from "#/variants/button";

/* -----------------------------------------------------------------------------
 * Component: InputNumber
 * -------------------------------------------------------------------------- */

/**
 * @since 0.3.16-canary.0
 */
type InputNumberProps = ComponentProps<typeof InputNumberPrimitive.Root>;

/**
 * The container that owns the numeric state (value, min, max, step, formatting).
 * Compose an {@link InputNumberField} with an {@link InputNumberStepper}, or with
 * {@link InputNumberDecrement} / {@link InputNumberIncrement} flanking the field.
 *
 * @since 0.3.16-canary.0
 */
function InputNumber({ className, spinner, ...props }: InputNumberProps): JSX.Element {
  return (
    <InputNumberPrimitive.Root
      className={cn(
        "group/input-number relative flex h-8 w-full min-w-0 items-center overflow-hidden rounded-lg border border-input bg-transparent text-base transition-[color,box-shadow] not-has-[input:disabled]:shadow-xs focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 has-[input:disabled]:bg-input/50 has-[input:disabled]:opacity-50 motion-reduce:transition-none md:text-sm dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40 dark:has-[input:disabled]:bg-input/80 [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      data-slot="input-number"
      spinner={spinner ?? <Spinner />}
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberField
 * -------------------------------------------------------------------------- */

type InputNumberFieldProps = ComponentProps<typeof InputNumberPrimitive.Field>;

/**
 * The editable numeric input.
 */
function InputNumberField({ className, ...props }: InputNumberFieldProps): JSX.Element {
  return (
    <InputNumberPrimitive.Field
      autoCapitalize="none"
      autoComplete="off"
      autoCorrect="off"
      className={cn(
        "h-full min-w-0 flex-1 bg-transparent px-2.5 py-1 tabular-nums outline-hidden selection:bg-primary selection:text-primary-foreground placeholder:text-muted-foreground disabled:pointer-events-none disabled:cursor-not-allowed",
        className,
      )}
      data-slot="input-number-field"
      spellCheck="false"
      {...props}
    />
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberStepper
 * -------------------------------------------------------------------------- */

type InputNumberStepperProps = Omit<ComponentProps<"div">, "children">;

/**
 * A stacked chevron column with the increment and decrement controls — the default
 * stepper layout. Place it after the field.
 */
function InputNumberStepper({ className, ...props }: InputNumberStepperProps): JSX.Element {
  return (
    <div
      className={cn(
        "grid h-full w-8 shrink-0 grid-rows-2 divide-y divide-input border-s border-s-input transition-colors group-focus-within/input-number:divide-ring group-focus-within/input-number:border-s-ring group-has-aria-invalid/input-number:divide-destructive group-has-aria-invalid/input-number:border-s-destructive motion-reduce:transition-none *:[button]:focus-visible:bg-ring/50 *:[button]:focus-visible:ring-0 group-has-aria-invalid/input-number:*:[button]:focus-visible:bg-destructive/20 dark:group-has-aria-invalid/input-number:*:[button]:focus-visible:bg-destructive/40",
        className,
      )}
      data-slot="input-number-stepper"
      {...props}
    >
      <InputNumberPrimitive.IncrementButton
        className={buttonVariants({
          className: "h-full min-w-0 rounded-none px-0 text-muted-foreground",
          variant: "ghost",
        })}
        data-slot="input-number-increment"
      >
        <ChevronUpIcon className="size-3.5" />
      </InputNumberPrimitive.IncrementButton>

      <InputNumberPrimitive.DecrementButton
        className={buttonVariants({
          className: "h-full min-w-0 rounded-none px-0 text-muted-foreground",
          variant: "ghost",
        })}
        data-slot="input-number-decrement"
      >
        <ChevronDownIcon className="size-3.5" />
      </InputNumberPrimitive.DecrementButton>
    </div>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberIncrement
 * -------------------------------------------------------------------------- */

type InputNumberIncrementProps = ComponentProps<typeof InputNumberPrimitive.IncrementButton>;

/**
 * A standalone increment button for the split layout. Defaults to a plus icon;
 * pass children to override.
 */
function InputNumberIncrement({ children, className, ...props }: InputNumberIncrementProps): JSX.Element {
  return (
    <InputNumberPrimitive.IncrementButton
      className={buttonVariants({
        className: cn(
          "h-full w-8 shrink-0 rounded-none rounded-e-[calc(var(--radius-lg)-1px)] border-s border-s-input text-muted-foreground group-focus-within/input-number:border-s-ring group-has-aria-invalid/input-number:border-s-destructive focus-visible:bg-ring/50 focus-visible:ring-0 group-has-aria-invalid/input-number:focus-visible:bg-destructive/20 dark:group-has-aria-invalid/input-number:focus-visible:bg-destructive/40",
          className,
        ),
        variant: "ghost",
      })}
      data-slot="input-number-increment"
      {...props}
    >
      {children ?? <PlusIcon />}
    </InputNumberPrimitive.IncrementButton>
  );
}

/* -----------------------------------------------------------------------------
 * Component: InputNumberDecrement
 * -------------------------------------------------------------------------- */

type InputNumberDecrementProps = ComponentProps<typeof InputNumberPrimitive.DecrementButton>;

/**
 * A standalone decrement button for the split layout. Defaults to a minus icon;
 * pass children to override.
 */
function InputNumberDecrement({ children, className, ...props }: InputNumberDecrementProps): JSX.Element {
  return (
    <InputNumberPrimitive.DecrementButton
      className={buttonVariants({
        className: cn(
          "h-full w-8 shrink-0 rounded-none rounded-s-[calc(var(--radius-lg)-1px)] border-e border-e-input text-muted-foreground group-focus-within/input-number:border-e-ring group-has-aria-invalid/input-number:border-e-destructive focus-visible:bg-ring/50 focus-visible:ring-0 group-has-aria-invalid/input-number:focus-visible:bg-destructive/20 dark:group-has-aria-invalid/input-number:focus-visible:bg-destructive/40",
          className,
        ),
        variant: "ghost",
      })}
      data-slot="input-number-decrement"
      {...props}
    >
      {children ?? <MinusIcon />}
    </InputNumberPrimitive.DecrementButton>
  );
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export { InputNumber, InputNumberDecrement, InputNumberField, InputNumberIncrement, InputNumberStepper };
export type {
  InputNumberDecrementProps,
  InputNumberFieldProps,
  InputNumberIncrementProps,
  InputNumberProps,
  InputNumberStepperProps,
};
