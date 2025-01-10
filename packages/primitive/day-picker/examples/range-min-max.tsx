import type { JSX } from 'react';

import { format } from 'date-fns';
import { useState } from 'react';

import type { DateRange } from '@/lib';

import { DayPicker } from '@/components';

export function RangeMinMax(): JSX.Element {
  const [range, setRange] = useState<DateRange | undefined>();

  let footer = `Please pick the first day.`;

  if (range?.from) {
    footer = range.to
      ? `${format(range.from, 'PPP')}—${format(range.to, 'PPP')}`
      : `${format(range.from, 'PPP')}—`;
  }

  return (
    <div>
      <p>Select up to 6 nights.</p>
      <DayPicker
        footer={footer}
        max={6}
        min={1}
        mode="range"
        selected={range}
        onSelect={setRange}
      />
    </div>
  );
}
