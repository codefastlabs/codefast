'use client';

import type { DateRange } from '@codefast/ui';
import type { ComponentProps, JSX } from 'react';

import { Calendar, cn } from '@codefast/ui';
import { useState } from 'react';

export type UiKitCalendarProps = ComponentProps<'div'>;

export function UiKitCalendar({ className, ...props }: UiKitCalendarProps): JSX.Element {
  const [single, setSingle] = useState<Date>(new Date());
  const [multiple, setMultiple] = useState<Date[]>([]);
  const [range, setRange] = useState<DateRange>({
    from: new Date(),
    to: new Date(),
  });

  return (
    <div className={cn('flex flex-wrap gap-8', className)} {...props}>
      <Calendar required mode="single" selected={single} onSelect={setSingle} />
      <Calendar required mode="multiple" selected={multiple} onSelect={setMultiple} />
      <Calendar required mode="range" selected={range} onSelect={setRange} />

      <Calendar required captionLayout="label" mode="single" selected={single} onSelect={setSingle} />
      <Calendar required captionLayout="label" mode="multiple" selected={multiple} onSelect={setMultiple} />
      <Calendar required captionLayout="label" mode="range" selected={range} onSelect={setRange} />

      <Calendar required captionLayout="dropdown" mode="single" selected={single} onSelect={setSingle} />
      <Calendar required captionLayout="dropdown" mode="multiple" selected={multiple} onSelect={setMultiple} />
      <Calendar required captionLayout="dropdown" mode="range" selected={range} onSelect={setRange} />

      <Calendar required captionLayout="dropdown-months" mode="single" selected={single} onSelect={setSingle} />
      <Calendar required captionLayout="dropdown-months" mode="multiple" selected={multiple} onSelect={setMultiple} />
      <Calendar required captionLayout="dropdown-months" mode="range" selected={range} onSelect={setRange} />

      <Calendar required captionLayout="dropdown-years" mode="single" selected={single} onSelect={setSingle} />
      <Calendar required captionLayout="dropdown-years" mode="multiple" selected={multiple} onSelect={setMultiple} />
      <Calendar required captionLayout="dropdown-years" mode="range" selected={range} onSelect={setRange} />

      <Calendar required showOutsideDays mode="single" selected={single} onSelect={setSingle} />
      <Calendar required showOutsideDays mode="multiple" selected={multiple} onSelect={setMultiple} />
      <Calendar required showOutsideDays mode="range" selected={range} onSelect={setRange} />

      <Calendar required showWeekNumber mode="single" selected={single} onSelect={setSingle} />
      <Calendar required showWeekNumber mode="multiple" selected={multiple} onSelect={setMultiple} />
      <Calendar required showWeekNumber mode="range" selected={range} onSelect={setRange} />

      <Calendar required showOutsideDays showWeekNumber mode="single" selected={single} onSelect={setSingle} />
      <Calendar required showOutsideDays showWeekNumber mode="multiple" selected={multiple} onSelect={setMultiple} />
      <Calendar required showOutsideDays showWeekNumber mode="range" selected={range} onSelect={setRange} />

      <Calendar
        required
        showOutsideDays
        showWeekNumber
        mode="single"
        numberOfMonths={2}
        selected={single}
        onSelect={setSingle}
      />
      <Calendar
        required
        showOutsideDays
        showWeekNumber
        mode="multiple"
        numberOfMonths={2}
        selected={multiple}
        onSelect={setMultiple}
      />
      <Calendar
        required
        showOutsideDays
        showWeekNumber
        mode="range"
        numberOfMonths={2}
        selected={range}
        onSelect={setRange}
      />
    </div>
  );
}
