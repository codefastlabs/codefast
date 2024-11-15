import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';

export function SingleRequired(): JSX.Element {
  const [selectedDay, setSelectedDay] = useState<Date>();

  return <DayPicker required mode="single" selected={selectedDay} onSelect={setSelectedDay} />;
}
