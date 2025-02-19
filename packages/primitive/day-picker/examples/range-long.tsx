import type { JSX } from 'react';

import { useState } from 'react';

import type { DateRange } from '@/lib';

import { DayPicker } from '@/components';

export function RangeLong(): JSX.Element {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(100, 0, 1),
    to: new Date(2024, 9, 10),
  });

  return <DayPicker defaultMonth={new Date(2024, 9)} mode="range" selected={range} onSelect={setRange} />;
}
