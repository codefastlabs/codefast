import { isSameDay } from 'date-fns';
import { type JSX, type MouseEvent, useState } from 'react';

import { DayPicker } from '@/components';
import { type DayEventHandler } from '@/lib';

export function CustomMultiple(): JSX.Element {
  const [value, setValue] = useState<Date[]>([]);

  const handleDayClick: DayEventHandler<MouseEvent> = (day, modifiers) => {
    const newValue = [...value];

    if (modifiers.selected) {
      const index = value.findIndex((d) => isSameDay(day, d));

      newValue.splice(index, 1);
    } else {
      newValue.push(day);
    }

    setValue(newValue);
  };

  const handleResetClick = (): void => {
    setValue([]);
  };

  let footer = <>Please pick one or more days.</>;

  if (value.length > 0) {
    footer = (
      <>
        You selected {value.length} days.{' '}
        <button type="button" onClick={handleResetClick}>
          Reset
        </button>
      </>
    );
  }

  return <DayPicker footer={footer} modifiers={{ selected: value }} onDayClick={handleDayClick} />;
}
