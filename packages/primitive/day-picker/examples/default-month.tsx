import type { JSX } from 'react';

import { DayPicker } from '@/components';

export function DefaultMonth(): JSX.Element {
  return <DayPicker defaultMonth={new Date(1990, 11)} />;
}
