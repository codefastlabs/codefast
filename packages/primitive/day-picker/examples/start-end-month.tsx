import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function StartEndMonth(): JSX.Element {
  const defaultMonth = new Date(2015, 5);

  return <DayPicker defaultMonth={defaultMonth} endMonth={new Date(2015, 10, 20)} startMonth={defaultMonth} />;
}
