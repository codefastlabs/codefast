import type { Scope } from "@radix-ui/react-context";
import type { ComponentProps, JSX } from "react";

import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { createCheckboxScope } from "@radix-ui/react-checkbox";
import { createContextScope } from "@radix-ui/react-context";
import { useDirection } from "@radix-ui/react-direction";
import * as RovingFocusGroup from "@radix-ui/react-roving-focus";
import { createRovingFocusGroupScope } from "@radix-ui/react-roving-focus";
import { useControllableState } from "@radix-ui/react-use-controllable-state";
import { useCallback } from "react";

/* -----------------------------------------------------------------------------
 * Context: CheckboxGroup
 * ---------------------------------------------------------------------------*/

const CHECKBOX_GROUP_NAME = "CheckboxGroup";

/**
 * Type for components that can be scoped within the CheckboxGroup context
 */
type ScopedProps<P> = P & {
  /**
   * Optional scope for the CheckboxGroup component
   */
  __scopeCheckboxGroup?: Scope;
};

const [createCheckboxGroupContext, createCheckboxGroupScope] = createContextScope(CHECKBOX_GROUP_NAME, [
  createRovingFocusGroupScope,
  createCheckboxScope,
]);

const useRovingFocusGroupScope = createRovingFocusGroupScope();
const useCheckboxScope = createCheckboxScope();

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
  value?: string[];
}

const [CheckboxGroupContextProvider, useCheckboxGroupContext] =
  createCheckboxGroupContext<CheckboxGroupContextValue>(CHECKBOX_GROUP_NAME);

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * ---------------------------------------------------------------------------*/

/**
 * Base props for the CheckboxGroup component
 */
interface CheckboxGroupBaseProps {
  /**
   * Default values for the checkbox group when uncontrolled
   */
  defaultValue?: string[];

  /**
   * Direction for roving focus navigation
   */
  dir?: RovingFocusGroup.RovingFocusGroupProps["dir"];

  /**
   * Whether the entire checkbox group is disabled
   */
  disabled?: boolean;

  /**
   * Whether focus should loop to the start/end when reaching the boundaries
   */
  loop?: RovingFocusGroup.RovingFocusGroupProps["loop"];

  /**
   * Name attribute for the checkbox group form field
   */
  name?: CheckboxGroupContextValue["name"];

  /**
   * Callback fired when the selected values change
   * @param value - The new array of selected values
   */
  onValueChange?: (value?: string[]) => void;

  /**
   * Orientation of the checkbox group (horizontal or vertical)
   */
  orientation?: RovingFocusGroup.RovingFocusGroupProps["orientation"];

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
 */
type CheckboxGroupProps = CheckboxGroupBaseProps & ComponentProps<"div">;

/**
 * CheckboxGroup component that manages a group of checkboxes with roving focus
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
  value: valueProp,
  ...props
}: ScopedProps<CheckboxGroupProps>): JSX.Element {
  /**
   * Scope for the RovingFocusGroup component
   */
  const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeCheckboxGroup);

  /**
   * Direction for layout and navigation
   */
  const direction = useDirection(dir);

  /**
   * State for managing selected checkbox values
   */
  const [value = [], setValue] = useControllableState<string[] | undefined>({
    defaultProp: defaultValue,
    onChange: onValueChange,
    prop: valueProp,
  });

  /**
   * Handles checking a checkbox item
   * @param itemValue - Value of the checkbox being checked
   */
  const handleItemCheck = useCallback(
    (itemValue: string) => {
      setValue((prevValue = []) => [...prevValue, itemValue]);
    },
    [setValue],
  );

  /**
   * Handles unchecking a checkbox item
   * @param itemValue - Value of the checkbox being unchecked
   */
  const handleItemUncheck = useCallback(
    (itemValue: string) => {
      setValue((prevValue = []) => {
        // If this is the last selected item and required=true, prevent unchecking
        if (required && prevValue.length === 1 && prevValue[0] === itemValue) {
          return prevValue; // Keep the current state
        }

        // Otherwise, proceed with unchecking
        return prevValue.filter((val) => val !== itemValue);
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
      <RovingFocusGroup.Root asChild {...rovingFocusGroupScope} dir={direction} loop={loop} orientation={orientation}>
        <div data-disabled={disabled ? "" : undefined} dir={direction} role="group" {...props} />
      </RovingFocusGroup.Root>
    </CheckboxGroupContextProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * ---------------------------------------------------------------------------*/
const ITEM_NAME = "CheckboxGroupItem";

/**
 * Props for the CheckboxGroupItem component
 */
interface CheckboxGroupItemProps
  extends Omit<
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
   * Scope for the RovingFocusGroup component
   */
  const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeCheckboxGroup);

  /**
   * Scope for the Checkbox component
   */
  const checkboxScope = useCheckboxScope(__scopeCheckboxGroup);

  /**
   * Whether this checkbox is currently checked
   */
  const checked = context.value?.includes(props.value);

  return (
    <RovingFocusGroup.Item asChild {...rovingFocusGroupScope} active={checked} focusable={!isDisabled}>
      <CheckboxPrimitive.Root
        aria-label={props.value}
        checked={checked}
        disabled={isDisabled}
        name={context.name}
        required={context.required}
        {...checkboxScope}
        {...props}
        onCheckedChange={(checkedState) => {
          if (checkedState) {
            context.onItemCheck(props.value);
          } else {
            context.onItemUncheck(props.value);
          }
        }}
      />
    </RovingFocusGroup.Item>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupIndicator
 * ---------------------------------------------------------------------------*/

/**
 * Props for the CheckboxGroupIndicator component
 */
type CheckboxGroupIndicatorProps = ComponentProps<typeof CheckboxPrimitive.Indicator>;

/**
 * Visual indicator component for a CheckboxGroupItem
 */
function CheckboxGroupIndicator({
  __scopeCheckboxGroup,
  ...props
}: ScopedProps<CheckboxGroupIndicatorProps>): JSX.Element {
  /**
   * Scope for the Checkbox component
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
