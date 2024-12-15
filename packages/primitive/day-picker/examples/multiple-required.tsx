import type { JSX } from 'react';

import { DayPicker } from '@/components';

export function MultipleRequired(): JSX.Element {
  return <DayPicker required mode="multiple" selected={[new Date()]} />;
}
