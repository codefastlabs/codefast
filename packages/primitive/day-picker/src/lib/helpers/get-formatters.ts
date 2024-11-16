import { type Locale } from 'date-fns/locale';

import { type DateLib, type DateLibOptions } from '@/lib/classes';
import * as defaultFormatters from '@/lib/formatters';
import { type DayPickerProps } from '@/lib/types';

/** Return the formatters from the props merged with the default formatters. */
export function getFormatters(customFormatters: DayPickerProps['formatters']): {
  formatCaption: (month: Date, options?: DateLibOptions, dateLib?: DateLib) => string;
  formatDay: (date: Date, options?: DateLibOptions, dateLib?: DateLib) => string;
  formatMonthDropdown: (monthNumber: number, locale?: Locale) => string;
  formatWeekNumber: (weekNumber: number) => string;
  formatWeekNumberHeader: () => string;
  formatWeekdayName: (weekday: Date, options?: DateLibOptions, dateLib?: DateLib) => string;
  formatYearDropdown: (year: number) => string;
} {
  return {
    ...defaultFormatters,
    ...customFormatters,
  };
}
