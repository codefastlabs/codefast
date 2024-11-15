import { es } from 'date-fns/locale/es';
import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function SpanishWeekStartsOn(): JSX.Element {
  return <DayPicker locale={es} weekStartsOn={0} />;
}
