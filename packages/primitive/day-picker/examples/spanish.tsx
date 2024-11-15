import { es } from 'date-fns/locale/es';
import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function Spanish(): JSX.Element {
  return <DayPicker locale={es} />;
}
