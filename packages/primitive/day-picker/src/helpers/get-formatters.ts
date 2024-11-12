import { type Locale } from 'date-fns/locale';

import { type DateLib, type DateLibOptions } from '@/classes';
import * as defaultFormatters from '@/formatters';
import type { DayPickerProps } from '@/types';

/** Return the formatters from the props merged with the default formatters. */
export function getFormatters(customFormatters: DayPickerProps['formatters']): {
  formatCaption: (month: Date, options?: DateLibOptions, dateLib?: DateLib) => string;
  formatDay: (date: Date, options?: DateLibOptions, dateLib?: DateLib) => string;
  formatMonthCaption: (month: Date, options?: DateLibOptions, dateLib?: DateLib) => string;
  formatMonthDropdown: (monthNumber: number, locale?: Locale) => string;
  formatWeekNumber: (weekNumber: number) => string;
  formatWeekNumberHeader: () => string;
  formatWeekdayName: (weekday: Date, options?: DateLibOptions, dateLib?: DateLib) => string;
  formatYearCaption: (year: number) => string;
  formatYearDropdown: (year: number) => string;
} {
  if (customFormatters?.formatMonthCaption && !customFormatters.formatCaption) {
    customFormatters.formatCaption = customFormatters.formatMonthCaption;
  }

  if (customFormatters?.formatYearCaption && !customFormatters.formatYearDropdown) {
    customFormatters.formatYearDropdown = customFormatters.formatYearCaption;
  }

  return {
    ...defaultFormatters,
    ...customFormatters,
  };
}
