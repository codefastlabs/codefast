import { labelYearDropdown } from '@/lib/labels/label-year-dropdown';

test('should return the label', () => {
  expect(labelYearDropdown()).toEqual('Choose the Year');
});
