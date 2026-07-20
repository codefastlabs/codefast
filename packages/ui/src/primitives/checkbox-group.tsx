import * as CheckboxPrimitive from "radix-ui/checkbox";
import * as Direction from "radix-ui/direction";
import { Context } from "radix-ui/internal";
import { RovingFocus } from "radix-ui/internal";
import { useControllableState } from "radix-ui/internal";
import type { ComponentProps, JSX } from "react";
import { useCallback } from "react";

/* -----------------------------------------------------------------------------
 * Context: CheckboxGroup
 * --------------------------------------------------------------------------- */

const CHECKBOX_GROUP_NAME = "CheckboxGroup";

/**
 * Type for components that can be scoped within the CheckboxGroup context
 */
type ScopedProps<P> = P & {
  /**
   * Optional scope for the CheckboxGroup component
   */
  __scopeCheckboxGroup?: Context.Scope;
};

const [createCheckboxGroupContext, createCheckboxGroupScope] = Context.createContextScope(CHECKBOX_GROUP_NAME, [
  RovingFocus.createRovingFocusGroupScope,
  CheckboxPrimitive.createCheckboxScope,
]);

const useRovingFocusGroupScope = RovingFocus.createRovingFocusGroupScope();
const useCheckboxScope = CheckboxPrimitive.createCheckboxScope();

/**
 * Context values shared between CheckboxGroup components
 */
interface CheckboxGroupContextValue {
  /**
   * Whether all checkbox items are disabled
   */
  disabled: boolean;

  /**
   * Function called when a checkbox item is checked
   * @param value - The value of the checked item
   */
  onItemCheck: (value: string) => void;

  /**
   * Function called when a checkbox item is unchecked
   * @param value - The value of the unchecked item
   */
  onItemUncheck: (value: string) => void;

  /**
   * Whether checkbox selection is required
   */
  required: boolean;

  /**
   * Optional name attribute for the checkbox group form field
   */
  name?: string;

  /**
   * Array of currently selected checkbox values
   */
  value?: Array<string>;
}

const [CheckboxGroupContextProvider, useCheckboxGroupContext] =
  createCheckboxGroupContext<CheckboxGroupContextValue>(CHECKBOX_GROUP_NAME);

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * --------------------------------------------------------------------------- */

/**
 * Base props for the CheckboxGroup component
 */
interface CheckboxGroupBaseProps {
  /**
   * Default values for the checkbox group when uncontrolled
   */
  defaultValue?: Array<string>;

  /**
   * Direction for roving focus navigation
   */
  dir?: RovingFocus.RovingFocusGroupProps["dir"];

  /**
   * Whether the entire checkbox group is disabled
   */
  disabled?: boolean;

  /**
   * Whether focus should loop to the start/end when reaching the boundaries
   */
  loop?: RovingFocus.RovingFocusGroupProps["loop"];

  /**
   * Name attribute for the checkbox group form field
   */
  name?: CheckboxGroupContextValue["name"];

  /**
   * Callback fired when the selected values change
   * @param value - The new array of selected values
   */
  onValueChange?: (value?: Array<string>) => void;

  /**
   * Orientation of the checkbox group (horizontal or vertical)
   */
  orientation?: RovingFocus.RovingFocusGroupProps["orientation"];

  /**
   * Whether at least one checkbox must be selected
   */
  required?: boolean;

  /**
   * Controlled values for the checkbox group
   */
  value?: CheckboxGroupContextValue["value"];
}

/**
 * Props for the CheckboxGroup component
 *
 * @since 0.3.16-canary.0
 */
type CheckboxGroupProps = CheckboxGroupBaseProps & ComponentProps<"div">;

/**
 * CheckboxGroup component that manages a group of checkboxes with roving focus
 *
 * @since 0.3.16-canary.0
 */
function CheckboxGroup({
  __scopeCheckboxGroup,
  defaultValue,
  dir,
  disabled = false,
  loop = true,
  name,
  onValueChange,
  orientation,
  required = false,
  value: valueProperty,
  ...props
}: ScopedProps<CheckboxGroupProps>): JSX.Element {
  /**
   * Context.Scope for the RovingFocusGroup component
   */
  const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeCheckboxGroup);

  /**
   * Direction for layout and navigation
   */
  const direction = Direction.useDirection(dir);

  /**
   * State for managing selected checkbox values
   */
  const [value = [], setValue] = useControllableState<Array<string> | undefined>({
    defaultProp: defaultValue,
    onChange: onValueChange,
    prop: valueProperty,
  });

  /**
   * Handles checking a checkbox item
   * @param itemValue - Value of the checkbox being checked
   */
  const handleItemCheck = useCallback(
    (itemValue: string) => {
      setValue((previousValue) => [...(previousValue ?? []), itemValue]);
    },
    [setValue],
  );

  /**
   * Handles unchecking a checkbox item
   * @param itemValue - Value of the checkbox being unchecked
   */
  const handleItemUncheck = useCallback(
    (itemValue: string) => {
      setValue((previousValue) => {
        const currentValue = previousValue ?? [];

        // If this is the last selected item and required=true, prevent unchecking
        if (required && currentValue.length === 1 && currentValue[0] === itemValue) {
          return currentValue; // Keep the current state
        }

        // Otherwise, proceed with unchecking
        return currentValue.filter((inputValue) => inputValue !== itemValue);
      });
    },
    [setValue, required],
  );

  return (
    <CheckboxGroupContextProvider
      disabled={disabled}
      name={name}
      required={required}
      scope={__scopeCheckboxGroup}
      value={value}
      onItemCheck={handleItemCheck}
      onItemUncheck={handleItemUncheck}
    >
      <RovingFocus.Root asChild {...rovingFocusGroupScope} dir={direction} loop={loop} orientation={orientation}>
        <div data-disabled={disabled ? "" : undefined} dir={direction} role="group" {...props} />
      </RovingFocus.Root>
    </CheckboxGroupContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * --------------------------------------------------------------------------- */
const ITEM_NAME = "CheckboxGroupItem";

/**
 * Props for the CheckboxGroupItem component
 *
 * @since 0.3.16-canary.0
 */
interface CheckboxGroupItemProps extends Omit<
  ComponentProps<typeof CheckboxPrimitive.Root>,
  "checked" | "defaultChecked" | "name" | "onCheckedChange"
> {
  /**
   * Value of the checkbox item, used to identify the item within the group
   */
  value: string;

  /**
   * Whether this specific checkbox item is disabled
   */
  disabled?: boolean;
}

/**
 * Individual checkbox item within a CheckboxGroup
 *
 * @since 0.3.16-canary.0
 */
function CheckboxGroupItem({
  __scopeCheckboxGroup,
  disabled,
  ...props
}: ScopedProps<CheckboxGroupItemProps>): JSX.Element {
  /**
   * Context values from the parent CheckboxGroup
   */
  const context = useCheckboxGroupContext(ITEM_NAME, __scopeCheckboxGroup);

  /**
   * Combined disabled state from both context and props
   */
  const isDisabled = context.disabled || disabled;

  /**
   * Context.Scope for the RovingFocusGroup component
   */
  const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeCheckboxGroup);

  /**
   * Context.Scope for the Checkbox component
   */
  const checkboxScope = useCheckboxScope(__scopeCheckboxGroup);

  /**
   * Whether this checkbox is currently checked
   */
  const checked = context.value?.includes(props.value);

  return (
    <RovingFocus.Item asChild {...rovingFocusGroupScope} active={checked} focusable={!isDisabled}>
      <CheckboxPrimitive.Root
        aria-label={props.value}
        checked={checked}
        disabled={isDisabled}
        name={context.name}
        required={context.required}
        {...checkboxScope}
        {...props}
        onCheckedChange={(checkedState: CheckboxPrimitive.CheckedState) => {
          if (checkedState) {
            context.onItemCheck(props.value);
          } else {
            context.onItemUncheck(props.value);
          }
        }}
      />
    </RovingFocus.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupIndicator
 * --------------------------------------------------------------------------- */

/**
 * Props for the CheckboxGroupIndicator component
 *
 * @since 0.3.16-canary.0
 */
type CheckboxGroupIndicatorProps = ComponentProps<typeof CheckboxPrimitive.Indicator>;

/**
 * Visual indicator component for a CheckboxGroupItem
 *
 * @since 0.3.16-canary.0
 */
function CheckboxGroupIndicator({
  __scopeCheckboxGroup,
  ...props
}: ScopedProps<CheckboxGroupIndicatorProps>): JSX.Element {
  /**
   * Context.Scope for the Checkbox component
   */
  const checkboxScope = useCheckboxScope(__scopeCheckboxGroup);

  return <CheckboxPrimitive.Indicator {...checkboxScope} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export {
  CheckboxGroup,
  CheckboxGroupIndicator,
  CheckboxGroupItem,
  createCheckboxGroupScope,
  CheckboxGroupIndicator as Indicator,
  CheckboxGroupItem as Item,
  CheckboxGroup as Root,
};

export type { CheckboxGroupIndicatorProps, CheckboxGroupItemProps, CheckboxGroupProps };
