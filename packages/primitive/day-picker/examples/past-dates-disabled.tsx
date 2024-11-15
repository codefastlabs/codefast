import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function PastDatesDisabled(): JSX.Element {
  return <DayPicker disabled={{ before: new Date() }} mode="single" />;
}
