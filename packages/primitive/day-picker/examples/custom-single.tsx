import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';
import { type DayPickerProps } from '@/lib';

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
