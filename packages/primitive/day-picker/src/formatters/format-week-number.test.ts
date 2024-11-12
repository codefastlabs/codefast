import { formatWeekNumber } from '@/formatters/format-week-number';

test('should return the formatted week number', () => {
  expect(formatWeekNumber(10)).toEqual('10');
});
