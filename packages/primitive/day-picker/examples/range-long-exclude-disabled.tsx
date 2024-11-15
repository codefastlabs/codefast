import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';
import { type DateRange } from '@/lib';

export function RangeLongExcludeDisabled(): JSX.Element {
  const [range, setRange] = useState<DateRange | undefined>({
    from: new Date(100, 0, 1),
    to: new Date(2024, 9, 10),
  });

  return (
    <DayPicker
      excludeDisabled
      defaultMonth={new Date(2000, 0)}
      disabled={new Date(2000, 0, 1)}
      mode="range"
      selected={range}
      onSelect={setRange}
    />
  );
}
