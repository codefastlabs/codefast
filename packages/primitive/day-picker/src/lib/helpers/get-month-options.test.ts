import type { Locale } from 'date-fns';

import { format } from 'date-fns';

import { defaultDateLib } from '@/lib/classes/date-lib';
import { getFormatters } from '@/lib/helpers/get-formatters';
import { getMonthOptions } from '@/lib/helpers/get-month-options';

test('return correct dropdown options', () => {
  const displayMonth = new Date(2022, 0, 1); // January 2022
  const startMonth = new Date(2022, 0, 1); // January 2022
  const endMonth = new Date(2022, 11, 31); // December 2022
  const formatters = getFormatters({
    formatMonthDropdown: (month: number, locale?: Locale) =>
      format(new Date(2022, month), 'MMMM', { locale }),
  });
  const result = getMonthOptions(displayMonth, startMonth, endMonth, formatters, defaultDateLib);

  expect(result).toEqual([
    { disabled: false, label: 'January', value: 0 },
    { disabled: false, label: 'February', value: 1 },
    { disabled: false, label: 'March', value: 2 },
    { disabled: false, label: 'April', value: 3 },
    { disabled: false, label: 'May', value: 4 },
    { disabled: false, label: 'June', value: 5 },
    { disabled: false, label: 'July', value: 6 },
    { disabled: false, label: 'August', value: 7 },
    { disabled: false, label: 'September', value: 8 },
    { disabled: false, label: 'October', value: 9 },
    { disabled: false, label: 'November', value: 10 },
    { disabled: false, label: 'December', value: 11 },
  ]);
});
