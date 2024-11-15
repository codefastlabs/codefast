import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function OutsideDays(): JSX.Element {
  return <DayPicker showOutsideDays today={new Date(2021, 10, 25)} />;
}
