import type { JSX } from 'react';

import { format } from 'date-fns';
import { arSA } from 'date-fns/locale';

import type { DateLibOptions } from '@/lib';

import { DayPicker } from '@/components';

export const NU_LOCALE = 'ar-u-nu-arab';

function formatDay(day: Date): string {
  return day.getDate().toLocaleString(NU_LOCALE);
}

function formatWeekNumber(weekNumber: number): string {
  return weekNumber.toLocaleString(NU_LOCALE);
}

function formatCaption(date: Date, options: DateLibOptions | undefined): string {
  const y = date.getFullYear().toLocaleString(NU_LOCALE);
  const m = format(date, 'LLLL', { locale: options?.locale });

  return `${m} ${y}`;
}

export function NumberingSystem(): JSX.Element {
  return (
    <DayPicker
      showWeekNumber
      dir="rtl"
      formatters={{ formatCaption, formatDay, formatWeekNumber }}
      locale={arSA}
    />
  );
}
