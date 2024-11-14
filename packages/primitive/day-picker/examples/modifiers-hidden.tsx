import { type JSX } from 'react';

import { DayPicker } from '@/components';

const hiddenDays = [new Date(2022, 5, 10), new Date(2022, 5, 20), new Date(2022, 5, 11)];

export function ModifiersHidden(): JSX.Element {
  return <DayPicker defaultMonth={hiddenDays[0]} hidden={hiddenDays} />;
}
