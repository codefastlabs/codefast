import type { JSX } from 'react';

import { DayPicker } from '@/components';

export function StartEndMonths(): JSX.Element {
  return (
    <DayPicker
      defaultMonth={new Date(2024, 0)}
      endMonth={new Date(2025, 11)}
      startMonth={new Date(2024, 0)}
    />
  );
}
