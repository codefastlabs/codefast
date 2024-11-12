import { type ComponentProps, type JSX } from 'react';

import { type ClassNames, type CustomComponents } from '@/types';
import { UI } from '@/ui';

/** An option to use in the dropdown. Maps to the `<option>` HTML element. */
export interface DropdownOption {
  /**
   * The dropdown option is disabled when it cannot be selected because out of
   * the calendar range.
   */
  disabled: boolean;
  /** The label of the option. */
  label: string;
  /** The value of the option. */
  value: number;
}

export type DropdownProps = Omit<ComponentProps<'select'>, 'children'> & {
  /**
   * @deprecated Use {@link useDayPicker} hook to get the list of internal
   *   class names.
   */
  classNames: ClassNames;
  /**
   * @deprecated Use{@link useDayPicker} hook to get the list of internal
   *   components.
   */
  components: CustomComponents;
  options?: DropdownOption[] | undefined;
};

/**
 * Render a dropdown component to use in the navigation bar.
 */
export function Dropdown(props: DropdownProps): JSX.Element {
  const { options, className, components, classNames, ...selectProps } = props;

  const cssClassSelect = [classNames[UI.Dropdown], className].join(' ');

  const selectedOption = options?.find(({ value }) => value === selectProps.value);

  return (
    <span className={classNames[UI.DropdownRoot]} data-disabled={selectProps.disabled}>
      <components.Select className={cssClassSelect} {...selectProps}>
        {options?.map(({ value, label, disabled }) => (
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
