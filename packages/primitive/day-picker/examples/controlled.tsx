import { addMonths, isSameMonth } from 'date-fns';
import { type ComponentProps, type JSX, useState } from 'react';

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
        style={{ all: 'unset', cursor: 'pointer', color: 'blue' }}
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
