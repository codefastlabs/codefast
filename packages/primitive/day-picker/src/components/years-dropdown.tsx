import { type JSX } from 'react';

import { type DropdownProps } from '@/components/dropdown';
import { useDayPicker } from '@/hooks/use-day-picker';

/**
 * Render the dropdown to navigate between years.
 */
export function YearsDropdown(props: DropdownProps): JSX.Element {
  const { components } = useDayPicker();

  return <components.Dropdown {...props} />;
}
