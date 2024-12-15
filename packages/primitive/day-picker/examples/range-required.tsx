import type { JSX } from 'react';

import { addDays, format, startOfMonth } from 'date-fns';
import { useState } from 'react';

import type { DateRange } from '@/lib';

import { DayPicker } from '@/components';

export function RangeRequired(): JSX.Element {
  const [range, setRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: addDays(startOfMonth(new Date()), 4),
  });

  let footer = `Please pick the first day.`;

  if (range.from) {
    footer = range.to ? `${format(range.from, 'PPP')}—${format(range.to, 'PPP')}` : `${format(range.from, 'PPP')}—`;
  }

  return <DayPicker required footer={footer} mode="range" selected={range} onSelect={setRange} />;
}
