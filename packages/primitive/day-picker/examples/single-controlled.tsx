import type { JSX } from 'react';

import { useState } from 'react';

import { DayPicker } from '@/components';

export function SingleControlled(): JSX.Element {
  const [selected, setSelected] = useState<Date | undefined>();

  return <DayPicker mode="single" selected={selected} onSelect={setSelected} />;
}
