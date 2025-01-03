import type { ComponentProps, JSX } from 'react';

import { addMonths, isSameMonth } from 'date-fns';
import { useState } from 'react';

import { DayPicker } from '@/components';

type ControlledProps = ComponentProps<'div'>;

export function Controlled(props: ControlledProps): JSX.Element {
  const today = new Date();
  const nextMonth = addMonths(new Date(), 1);
  const [month, setMonth] = useState<Date>(nextMonth);

  return (
    <div {...props}>
      <DayPicker month={month} onMonthChange={setMonth} />
      <button
        disabled={isSameMonth(today, month)}
        style={{ all: 'unset', color: 'blue', cursor: 'pointer' }}
        type="button"
        onClick={() => {
          setMonth(today);
        }}
      >
        Go to Today
      </button>
    </div>
  );
}
