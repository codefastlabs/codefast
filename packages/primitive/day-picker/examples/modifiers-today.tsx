import { type JSX, type MouseEvent, useState } from 'react';

import { DayPicker } from '@/components';
import { type DayEventHandler } from '@/lib';

export function ModifiersToday(): JSX.Element {
  const initialFooter = 'Try clicking the today’s date.';
  const [footer, setFooter] = useState(initialFooter);

  const handleDayClick: DayEventHandler<MouseEvent> = (_day, modifiers) => {
    if (modifiers.today) {
      setFooter('You clicked the today’s date.');
    } else {
      setFooter('This is not the today’s date.');
    }
  };

  return <DayPicker footer={footer} onDayClick={handleDayClick} />;
}
