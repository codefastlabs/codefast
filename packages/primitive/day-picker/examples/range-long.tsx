import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';
import { type DateRange } from '@/lib';

export function RangeLong(): JSX.Element {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(100, 0, 1),
    to: new Date(2024, 9, 10),
  });

  return <DayPicker defaultMonth={new Date(2024, 9)} mode="range" selected={range} onSelect={setRange} />;
}
