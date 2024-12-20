import type { JSX } from 'react';

import { endOfWeek, startOfWeek } from 'date-fns';
import { useState } from 'react';

import type { DateRange } from '@/lib';

import { DayPicker } from '@/components';
import { rangeIncludesDate } from '@/lib';

export function CustomWeek(): JSX.Element {
  const [selectedWeek, setSelectedWeek] = useState<DateRange | undefined>();

  return (
    <DayPicker
      showOutsideDays
      showWeekNumber
      footer={
        selectedWeek
          ? `Week from ${selectedWeek.from?.toLocaleDateString()} to
            ${selectedWeek.to?.toLocaleDateString()}`
          : null
      }
      modifiers={{
        range_end: selectedWeek?.to,
        range_middle: (date: Date) => (selectedWeek ? rangeIncludesDate(selectedWeek, date, true) : false),
        range_start: selectedWeek?.from,
        selected: selectedWeek,
      }}
      onDayClick={(day, modifiers) => {
        if (modifiers.selected) {
          setSelectedWeek(undefined); // clear the selection if the week is already selected

          return;
        }

        setSelectedWeek({
          from: startOfWeek(day),
          to: endOfWeek(day),
        });
      }}
    />
  );
}
