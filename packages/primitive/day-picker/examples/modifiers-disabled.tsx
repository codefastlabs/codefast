import type { JSX } from 'react';

import { DayPicker } from '@/components';

export function ModifiersDisabled(): JSX.Element {
  return <DayPicker disabled={{ dayOfWeek: [0, 6] }} mode="range" />;
}
