import type { JSX } from 'react';

import { useState } from 'react';

import type { DayPickerProps } from '@/lib';

import { DayPicker } from '@/components';

export function CustomSingle(): JSX.Element {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>();
  const modifiers: DayPickerProps['modifiers'] = {};

  if (selectedDate) {
    modifiers.selected = selectedDate;
  }

  return (
    <DayPicker
      footer={selectedDate ? `You selected ${selectedDate.toDateString()}` : null}
      modifiers={modifiers}
      onDayClick={(day, dayModifiers) => {
        if (dayModifiers.selected) {
          setSelectedDate(undefined);
        } else {
          setSelectedDate(day);
        }
      }}
    />
  );
}
