import type { Scope } from '@radix-ui/react-context';
import type { ComponentProps, JSX } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { createCheckboxScope } from '@radix-ui/react-checkbox';
import { createContextScope } from '@radix-ui/react-context';
import { useDirection } from '@radix-ui/react-direction';
import * as RovingFocusGroup from '@radix-ui/react-roving-focus';
import { createRovingFocusGroupScope } from '@radix-ui/react-roving-focus';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { useCallback } from 'react';

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroup
 * ---------------------------------------------------------------------------*/

const CHECKBOX_GROUP_NAME = 'CheckboxGroup';

type ScopedProps<P> = P & { __scopeCheckboxGroup?: Scope };

const [createCheckboxGroupContext, createCheckboxGroupScope] = createContextScope(CHECKBOX_GROUP_NAME, [
  createRovingFocusGroupScope,
  createCheckboxScope,
]);

const useRovingFocusGroupScope = createRovingFocusGroupScope();
const useCheckboxScope = createCheckboxScope();

interface CheckboxGroupContextValue {
  disabled: boolean;
  onItemCheck: (value: string) => void;
  onItemUncheck: (value: string) => void;
  required: boolean;
  name?: string;
  value?: string[];
}

const [CheckboxGroupProvider, useCheckboxGroupContext] =
  createCheckboxGroupContext<CheckboxGroupContextValue>(CHECKBOX_GROUP_NAME);

interface CheckboxGroupProps extends ComponentProps<'div'> {
  defaultValue?: string[];
  dir?: RovingFocusGroup.RovingFocusGroupProps['dir'];
  disabled?: boolean;
  loop?: RovingFocusGroup.RovingFocusGroupProps['loop'];
  name?: CheckboxGroupContextValue['name'];
  onValueChange?: (value: string[]) => void;
  orientation?: RovingFocusGroup.RovingFocusGroupProps['orientation'];
  required?: boolean;
  value?: CheckboxGroupContextValue['value'];
}

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
  const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeCheckboxGroup);
  const direction = useDirection(dir);
  const [value = [], setValue] = useControllableState({
    defaultProp: defaultValue,
    onChange: onValueChange,
    prop: valueProp,
  });

  const handleItemCheck = useCallback(
    (itemValue: string) => {
      setValue((prevValue = []) => [...prevValue, itemValue]);
    },
    [setValue],
  );

  const handleItemUncheck = useCallback(
    (itemValue: string) => {
      setValue((prevValue = []) => prevValue.filter((val) => val !== itemValue));
    },
    [setValue],
  );

  return (
    <CheckboxGroupProvider
      disabled={disabled}
      name={name}
      required={required}
      scope={__scopeCheckboxGroup}
      value={value}
      onItemCheck={handleItemCheck}
      onItemUncheck={handleItemUncheck}
    >
      <RovingFocusGroup.Root asChild {...rovingFocusGroupScope} dir={direction} loop={loop} orientation={orientation}>
        <div data-disabled={disabled ? '' : undefined} dir={direction} role="group" {...props} />
      </RovingFocusGroup.Root>
    </CheckboxGroupProvider>
  );
}

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * ---------------------------------------------------------------------------*/

const ITEM_NAME = 'CheckboxGroupItem';

interface CheckboxGroupItemProps
  extends Omit<
    ComponentProps<typeof CheckboxPrimitive.Root>,
    'checked' | 'defaultChecked' | 'name' | 'onCheckedChange'
  > {
  value: string;
}

function CheckboxGroupItem({
  __scopeCheckboxGroup,
  disabled,
  ...props
}: ScopedProps<CheckboxGroupItemProps>): JSX.Element {
  const context = useCheckboxGroupContext(ITEM_NAME, __scopeCheckboxGroup);
  const isDisabled = context.disabled || disabled;
  const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeCheckboxGroup);
  const checkboxScope = useCheckboxScope(__scopeCheckboxGroup);
  const checked = context.value?.includes(props.value);

  return (
    <RovingFocusGroup.Item asChild {...rovingFocusGroupScope} active={checked} focusable={!isDisabled}>
      <CheckboxPrimitive.Root
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

type CheckboxGroupIndicatorProps = ComponentProps<typeof CheckboxPrimitive.Indicator>;

function CheckboxGroupIndicator({
  __scopeCheckboxGroup,
  ...props
}: ScopedProps<CheckboxGroupIndicatorProps>): JSX.Element {
  const checkboxScope = useCheckboxScope(__scopeCheckboxGroup);

  return <CheckboxPrimitive.Indicator {...checkboxScope} {...props} />;
}

/* -----------------------------------------------------------------------------
 * Exports
 * -------------------------------------------------------------------------- */

export type { CheckboxGroupIndicatorProps, CheckboxGroupItemProps, CheckboxGroupProps };
export {
  CheckboxGroup,
  CheckboxGroupIndicator,
  CheckboxGroupItem,
  createCheckboxGroupScope,
  CheckboxGroupIndicator as Indicator,
  CheckboxGroupItem as Item,
  CheckboxGroup as Root,
};
