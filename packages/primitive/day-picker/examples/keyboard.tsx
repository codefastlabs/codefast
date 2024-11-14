import { type JSX, useState } from 'react';

import { DayPicker } from '@/components';
import { type DayPickerProps, type PropsSingle } from '@/lib';

export function Keyboard(props: DayPickerProps & PropsSingle): JSX.Element {
  const [selected, setSelected] = useState<Date | undefined>(undefined);

  return (
    <DayPicker {...props} mode="single" selected={selected} today={new Date(2022, 5, 10)} onSelect={setSelected} />
  );
}
