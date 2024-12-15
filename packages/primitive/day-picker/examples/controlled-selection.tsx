import type { JSX } from 'react';

import { useState } from 'react';

import type { DateRange, OnSelectHandler } from '@/lib';

import { DayPicker } from '@/components';

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
