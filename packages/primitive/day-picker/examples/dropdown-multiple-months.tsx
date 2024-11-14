import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function DropdownMultipleMonths(): JSX.Element {
  return (
    <DayPicker
      captionLayout="dropdown"
      endMonth={new Date(2025, 0)}
      numberOfMonths={5}
      startMonth={new Date(2015, 0)}
    />
  );
}
