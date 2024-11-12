import { labelWeekNumber } from '@/labels/label-week-number';

test('should return the label', () => {
  expect(labelWeekNumber(2)).toEqual('Week 2');
});
