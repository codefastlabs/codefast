import { format } from 'date-fns';
import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';
import { type DateRange } from '@/lib';

export function RangeMinMax(): JSX.Element {
  const [range, setRange] = useState<DateRange | undefined>();

  let footer = `Please pick the first day.`;

  if (range?.from) {
    if (!range.to) {
      footer = `${format(range.from, 'PPP')}—`;
    } else {
      footer = `${format(range.from, 'PPP')}—${format(range.to, 'PPP')}`;
    }
  }

  return (
    <div>
      <p>Select up to 6 nights.</p>
      <DayPicker footer={footer} max={6} min={1} mode="range" selected={range} onSelect={setRange} />
    </div>
  );
}
