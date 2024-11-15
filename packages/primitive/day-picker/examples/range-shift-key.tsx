import { isSameDay } from 'date-fns';
import { type JSX, type MouseEventHandler, useState } from 'react';

import { type DayButtonProps, DayPicker } from '@/components';
import { type DateRange, useDayPicker } from '@/lib';

export function RangeShiftKey(): JSX.Element {
  const [range, setRange] = useState<DateRange | undefined>({
    from: undefined,
  });

  let footer = 'Please pick a day.';

  if (range?.from && !range.to) {
    footer = 'Press Shift to choose more days.';
  } else if (range?.to) {
    const formattedFrom = range.from?.toDateString();
    const formattedTo = range.to.toDateString();

    footer = `You selected the days between ${formattedFrom} and ${formattedTo}`;
  }

  return (
    <DayPicker
      components={{
        DayButton: DayWithShiftKey,
      }}
      footer={footer}
      mode="range"
      selected={range}
      onSelect={setRange}
    />
  );
}

function DayWithShiftKey(props: DayButtonProps): JSX.Element {
  const { selected } = useDayPicker<{ mode: 'range' }>();

  const handleClick: MouseEventHandler<HTMLButtonElement> = (e) => {
    const requireShiftKey = selected?.from && !isSameDay(props.day.date, selected.from);

    if (!e.shiftKey && requireShiftKey) {
      return;
    }

    props.onClick?.(e);
  };

  return (
    <button {...props} type="button" onClick={handleClick}>
      {props.children}
    </button>
  );
}
