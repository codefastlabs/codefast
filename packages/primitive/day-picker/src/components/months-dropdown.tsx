import { type JSX } from 'react';

import { type DropdownProps } from '@/components/dropdown';
import { useDayPicker } from '@/use-day-picker';

/**
 * Render the dropdown to navigate between months.
 */
export function MonthsDropdown(props: DropdownProps): JSX.Element {
  const { components } = useDayPicker();

  return <components.Dropdown {...props} />;
}
