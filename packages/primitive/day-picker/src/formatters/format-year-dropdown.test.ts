import { formatYearDropdown } from '@/formatters/format-year-dropdown';

test('should return the formatted weekday name', () => {
  expect(formatYearDropdown(2022)).toEqual('2022');
});
