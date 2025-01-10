import { defaultDateLib } from '@/lib/classes/date-lib';
import { getFormatters } from '@/lib/helpers/get-formatters';
import { getYearOptions } from '@/lib/helpers/get-year-options';

test('return undefined if startMonth or endMonth is not provided', () => {
  const displayMonth = new Date(2022, 0, 1); // January 2022
  const formatters = getFormatters({
    formatYearDropdown: (year: number) => `${year}`,
  });
  const result1 = getYearOptions(
    displayMonth,
    undefined,
    new Date(2022, 11, 31),
    formatters,
    defaultDateLib,
  );
  const result2 = getYearOptions(
    displayMonth,
    new Date(2022, 0, 1),
    undefined,
    formatters,
    defaultDateLib,
  );

  expect(result1).toBeUndefined();
  expect(result2).toBeUndefined();
});

test('return correct dropdown options', () => {
  const displayMonth = new Date(2022, 0, 1); // January 2022
  const startMonth = new Date(2022, 0, 1); // January 2022
  const endMonth = new Date(2024, 11, 31); // December 2024
  const formatters = getFormatters({
    formatYearDropdown: (year: number) => `${year}`,
  });

  const result = getYearOptions(displayMonth, startMonth, endMonth, formatters, defaultDateLib);

  expect(result).toEqual([
    { disabled: false, label: '2022', value: 2022 },
    { disabled: false, label: '2023', value: 2023 },
    { disabled: false, label: '2024', value: 2024 },
  ]);
});
