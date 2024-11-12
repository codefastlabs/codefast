import { labelMonthDropdown } from '@/labels/label-month-dropdown';

test('should return the label', () => {
  expect(labelMonthDropdown({})).toEqual('Choose the Month');
});
