import { labelGridCell } from '@/labels/label-grid-cell';

const day = new Date(2022, 10, 21);

test('return the label', () => {
  expect(labelGridCell(day)).toEqual('Monday, November 21st, 2022');
});
