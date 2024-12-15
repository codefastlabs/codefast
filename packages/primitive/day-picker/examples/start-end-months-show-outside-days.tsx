import type { JSX } from 'react';

import { useState } from 'react';

import { DayPicker } from '@/components';

export function StartEndMonthsShowOutsideDays(): JSX.Element {
  const [selected, setSelected] = useState<Date>();

  return (
    <DayPicker
      showOutsideDays
      defaultMonth={new Date(2024, 2)}
      disabled={new Date(2024, 2, 10)}
      endMonth={new Date(2024, 2, 1)}
      mode="single"
      selected={selected}
      startMonth={new Date(2024, 2, 30)}
      onSelect={setSelected}
    />
  );
}
