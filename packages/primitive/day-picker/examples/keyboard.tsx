import type { JSX } from 'react';

import { useState } from 'react';

import type { SingleProps, SingleRequiredProps } from '@/lib';

import { DayPicker } from '@/components';

export function Keyboard(props: SingleProps | SingleRequiredProps): JSX.Element {
  const [selected, setSelected] = useState<Date | undefined>();

  return (
    <DayPicker
      {...props}
      mode="single"
      selected={selected}
      today={new Date(2022, 5, 10)}
      onSelect={setSelected}
    />
  );
}
