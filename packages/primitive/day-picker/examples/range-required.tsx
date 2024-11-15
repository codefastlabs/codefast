import { addDays, format, startOfMonth } from 'date-fns';
import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';
import { type DateRange } from '@/lib';

export function RangeRequired(): JSX.Element {
  const [range, setRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: addDays(startOfMonth(new Date()), 4),
  });

  let footer = `Please pick the first day.`;

  if (range.from) {
    if (!range.to) {
      footer = `${format(range.from, 'PPP')}—`;
    } else {
      footer = `${format(range.from, 'PPP')}—${format(range.to, 'PPP')}`;
    }
  }

  return <DayPicker required footer={footer} mode="range" selected={range} onSelect={setRange} />;
}
