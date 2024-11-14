import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';
import { type DateRange, type OnSelectHandler } from '@/lib';

export function ControlledSelection(): JSX.Element {
  const [selected, setSelected] = useState<DateRange | undefined>();

  const handleOnSelect: OnSelectHandler<DateRange | undefined> = (range, triggerDate): void => {
    // Change the behavior of the selection when a range is already selected
    if (selected?.from && selected.to) {
      setSelected({
        from: triggerDate,
        to: undefined,
      });
    } else {
      setSelected(range);
    }
  };

  return <DayPicker min={1} mode="range" selected={selected} onSelect={handleOnSelect} />;
}
