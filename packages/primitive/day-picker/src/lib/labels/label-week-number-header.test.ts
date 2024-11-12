import { labelWeekNumberHeader } from '@/lib/labels/label-week-number-header';

test('should return the label', () => {
  expect(labelWeekNumberHeader()).toEqual('Week Number');
});
