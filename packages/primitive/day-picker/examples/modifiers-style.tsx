import { type JSX } from 'react';

import { DayPicker } from '@/components';

export const availableDays = [new Date(2021, 5, 23), new Date(2021, 5, 24)];

const availableStyle = {
  fontWeight: 900,
  color: 'lightgreen',
};

export function ModifiersStyle(): JSX.Element {
  return (
    <DayPicker
      defaultMonth={availableDays[0]}
      mode="single"
      modifiers={{
        available: availableDays,
      }}
      modifiersStyles={{
        available: availableStyle,
      }}
    />
  );
}