import type { JSX } from 'react';

import { arSA } from 'date-fns/locale';

import { DayPicker } from '@/components';

export function Rtl(): JSX.Element {
  return <DayPicker dir="rtl" locale={arSA} />;
}
