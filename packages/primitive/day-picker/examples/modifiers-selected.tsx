import { subDays } from 'date-fns';
import { type JSX } from 'react';

import { DayPicker } from '@/components';
import { type OnSelectHandler } from '@/lib';

const handleSelect: OnSelectHandler<Date | undefined> = (_value, _date, modifiers) => {
  if (modifiers.selected) {
    // eslint-disable-next-line no-alert -- This is a test message
    alert('You clicked a selected day.');
  }

  if (modifiers.today) {
    // eslint-disable-next-line no-alert -- This is a test message
    alert('You clicked today');
  }
};

export function ModifiersSelected(): JSX.Element {
  const yesterday = subDays(new Date(), 1);

  return <DayPicker mode="single" selected={yesterday} onSelect={handleSelect} />;
}
