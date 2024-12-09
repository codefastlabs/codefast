import { type ComponentProps, type JSX } from 'react';

import { useDayPicker } from '@/lib';
import { UI } from '@/lib/constants/ui';

/**
 * An option to use in the dropdown. Maps to the `<option>` HTML element.
 */
export interface DropdownOption {
  /**
   * The dropdown option is disabled when it can't be selected because out of the calendar range.
   */
  disabled: boolean;

  /**
   * The label of the option.
   */
  label: string;

  /**
   * The value of the option.
   */
  value: number;
}

export type DropdownProps = Omit<ComponentProps<'select'>, 'children'> & {
  options?: DropdownOption[] | undefined;
};

/**
 * Render a dropdown component to use in the navigation bar.
 */
export function Dropdown({ className, options, ...props }: DropdownProps): JSX.Element {
  const { classNames, components } = useDayPicker();
  const cssClassSelect = [classNames[UI.Dropdown], className].join(' ');

  const selectedOption = options?.find(({ value }) => value === props.value);

  return (
    <span className={classNames[UI.DropdownRoot]} data-disabled={props.disabled}>
      <components.Select className={cssClassSelect} {...props}>
        {options?.map(({ disabled, label, value }) => (
          <components.Option key={value} disabled={disabled} value={value}>
            {label}
          </components.Option>
        ))}
      </components.Select>
      <span aria-hidden className={classNames[UI.CaptionLabel]}>
        {selectedOption?.label}
        <components.Chevron className={classNames[UI.Chevron]} orientation="down" size={18} />
      </span>
    </span>
  );
}
