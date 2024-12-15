import type { Scope } from '@radix-ui/react-context';
import type { ComponentPropsWithoutRef, ComponentRef, HTMLAttributes } from 'react';

import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { createCheckboxScope } from '@radix-ui/react-checkbox';
import { createContextScope } from '@radix-ui/react-context';
import { useDirection } from '@radix-ui/react-direction';
import * as RovingFocusGroup from '@radix-ui/react-roving-focus';
import { createRovingFocusGroupScope } from '@radix-ui/react-roving-focus';
import { useControllableState } from '@radix-ui/react-use-controllable-state';
import { forwardRef, useCallback } from 'react';

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

type CheckboxGroupElement = HTMLDivElement;

interface CheckboxGroupProps extends HTMLAttributes<HTMLDivElement> {
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

const CheckboxGroup = forwardRef<CheckboxGroupElement, CheckboxGroupProps>(
  (
    {
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
    }: ScopedProps<CheckboxGroupProps>,
    forwardedRef,
  ) => {
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
          <div ref={forwardedRef} data-disabled={disabled ? '' : undefined} dir={direction} role="group" {...props} />
        </RovingFocusGroup.Root>
      </CheckboxGroupProvider>
    );
  },
);

CheckboxGroup.displayName = CHECKBOX_GROUP_NAME;

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupItem
 * ---------------------------------------------------------------------------*/

const ITEM_NAME = 'CheckboxGroupItem';

type CheckboxGroupItemElement = ComponentRef<typeof CheckboxPrimitive.Root>;

interface CheckboxGroupItemProps
  extends Omit<
    ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>,
    'checked' | 'defaultChecked' | 'name' | 'onCheckedChange'
  > {
  value: string;
}

const CheckboxGroupItem = forwardRef<CheckboxGroupItemElement, CheckboxGroupItemProps>(
  ({ __scopeCheckboxGroup, disabled, ...props }: ScopedProps<CheckboxGroupItemProps>, forwardedRef) => {
    const context = useCheckboxGroupContext(ITEM_NAME, __scopeCheckboxGroup);
    const isDisabled = context.disabled || disabled;
    const rovingFocusGroupScope = useRovingFocusGroupScope(__scopeCheckboxGroup);
    const checkboxScope = useCheckboxScope(__scopeCheckboxGroup);
    const checked = context.value?.includes(props.value);

    return (
      <RovingFocusGroup.Item asChild {...rovingFocusGroupScope} active={checked} focusable={!isDisabled}>
        <CheckboxPrimitive.Root
          ref={forwardedRef}
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
  },
);

CheckboxGroupItem.displayName = ITEM_NAME;

/* -----------------------------------------------------------------------------
 * Component: CheckboxGroupIndicator
 * ---------------------------------------------------------------------------*/

const INDICATOR_NAME = 'CheckboxGroupIndicator';

type CheckboxGroupIndicatorElement = ComponentRef<typeof CheckboxPrimitive.Indicator>;
type CheckboxGroupIndicatorProps = ComponentPropsWithoutRef<typeof CheckboxPrimitive.Indicator>;

const CheckboxGroupIndicator = forwardRef<CheckboxGroupIndicatorElement, CheckboxGroupIndicatorProps>(
  ({ __scopeCheckboxGroup, ...props }: ScopedProps<CheckboxGroupIndicatorProps>, forwardedRef) => {
    const checkboxScope = useCheckboxScope(__scopeCheckboxGroup);

    return <CheckboxPrimitive.Indicator ref={forwardedRef} {...checkboxScope} {...props} />;
  },
);

CheckboxGroupIndicator.displayName = INDICATOR_NAME;

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
