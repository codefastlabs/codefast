import type { JSX, MouseEvent } from 'react';

import { isSameDay } from 'date-fns';
import { useState } from 'react';

import type { DayEventHandler } from '@/lib';

import { DayPicker } from '@/components';

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
