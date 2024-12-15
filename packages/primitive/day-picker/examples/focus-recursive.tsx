import type { JSX } from 'react';

import { DayPicker } from '@/components';

export function FocusRecursive(): JSX.Element {
  const disabledDays = [
    new Date(2022, 5, 4),
    {
      after: new Date(2022, 5, 26),
    },
  ];

  return (
    <DayPicker defaultMonth={new Date(2022, 5)} disabled={disabledDays} mode="single" today={new Date(2022, 5, 1)} />
  );
}
