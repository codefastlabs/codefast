import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';

export function Start(): JSX.Element {
  const [selected, setSelected] = useState<Date>();

  return (
    <DayPicker
      footer={selected ? `Selected: ${selected.toLocaleDateString()}` : 'Pick a day.'}
      mode="single"
      selected={selected}
      onSelect={setSelected}
    />
  );
}
