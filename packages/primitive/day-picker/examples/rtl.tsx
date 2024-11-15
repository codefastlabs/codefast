import { arSA } from 'date-fns/locale';
import { type JSX } from 'react';

import { DayPicker } from '@/components';

export function Rtl(): JSX.Element {
  return <DayPicker dir="rtl" locale={arSA} />;
}
