import type { JSX } from 'react';

import { addDays } from 'date-fns';

import { DayPicker } from '@/components';

export function MultipleMinMax(): JSX.Element {
  const selected = [new Date(), addDays(new Date(), 1)];

  return <DayPicker max={5} min={2} mode="multiple" selected={selected} />;
}
