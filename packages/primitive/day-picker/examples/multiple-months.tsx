import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function MultipleMonths(): JSX.Element {
  return <DayPicker numberOfMonths={2} />;
}
