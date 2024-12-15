import type { JSX } from 'react';

import { addDays, format } from 'date-fns';
import { useMemo, useState } from 'react';

import type { DateRange } from '@/lib';

import { DayPicker } from '@/components';

export function Range(): JSX.Element {
  const defaultMonth = new Date(2020, 5, 15);

  const defaultSelected: DateRange = {
    from: defaultMonth,
    to: addDays(defaultMonth, 4),
  };
  const [range, setRange] = useState<DateRange | undefined>(defaultSelected);

  const footer = useMemo(() => {
    if (range?.from) {
      if (!range.to) {
        return format(range.from, 'PPP');
      }

      return `${format(range.from, 'PPP')}–${format(range.to, 'PPP')}`;
    }

    return `Please pick the first day.`;
  }, [range]);

  return (
    <div>
      <DayPicker
        defaultMonth={defaultMonth}
        footer={footer}
        id="test"
        mode="range"
        selected={range}
        onSelect={setRange}
      />
      <button
        type="button"
        onClick={() => {
          setRange(undefined);
        }}
      >
        Reset
      </button>
    </div>
  );
}
