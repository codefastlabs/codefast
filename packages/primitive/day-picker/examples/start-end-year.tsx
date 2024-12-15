import type { JSX } from 'react';

import { DayPicker } from '@/components';

export function StartEndYear(): JSX.Element {
  const defaultMonth = new Date(2024, 0);

  return <DayPicker defaultMonth={defaultMonth} endMonth={new Date(2026, 0)} startMonth={defaultMonth} />;
}
