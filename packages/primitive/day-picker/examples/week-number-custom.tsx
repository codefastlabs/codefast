import { addMonths } from 'date-fns';
import { type JSX } from 'react';

import { DayPicker, type WeekNumberProps } from '@/components';

const today = new Date(2021, 0, 1);

export function WeekNumberCustom(): JSX.Element {
  return (
    <DayPicker
      showWeekNumber
      components={{
        // eslint-disable-next-line react/no-unstable-nested-components -- demo
        WeekNumber: ({ week, ...props }: WeekNumberProps) => (
          <th {...props}>
            <button
              type="button"
              onClick={() => {
                // eslint-disable-next-line no-console -- demo
                console.log(week);
              }}
            >
              {props.children}
            </button>
          </th>
        ),
      }}
      defaultMonth={addMonths(today, -1)}
      formatters={{
        formatWeekNumber: (weekNumber: number) => `W${weekNumber}`,
      }}
      labels={{
        labelWeekNumber: (weekNumber: number) => `W${weekNumber}`,
      }}
    />
  );
}
