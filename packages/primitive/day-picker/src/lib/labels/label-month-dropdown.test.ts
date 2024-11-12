import { labelMonthDropdown } from '@/lib/labels/label-month-dropdown';

test('should return the label', () => {
  expect(labelMonthDropdown({})).toEqual('Choose the Month');
});
