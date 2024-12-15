import type { JSX } from 'react';

import { DayPicker } from '@/components';

export function RangeExcludeDisabled(): JSX.Element {
  return <DayPicker excludeDisabled disabled={{ dayOfWeek: [0, 6] }} mode="range" />;
}
