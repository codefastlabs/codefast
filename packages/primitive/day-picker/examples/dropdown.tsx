import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function Dropdown(): JSX.Element {
  return (
    <DayPicker
      captionLayout="dropdown"
      defaultMonth={new Date(2024, 6)}
      endMonth={new Date(2025, 9)}
      startMonth={new Date(2024, 6)}
    />
  );
}
