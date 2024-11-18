import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function FixedWeeks(): JSX.Element {
  return <DayPicker fixedWeeks showOutsideDays showWeekNumber defaultMonth={new Date(2026, 1)} numberOfMonths={12} />;
}
