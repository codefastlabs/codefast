import { labelGridcell } from '@/lib/labels/label-grid-cell';

const day = new Date(2022, 10, 21);

test('return the label', () => {
  expect(labelGridcell(day)).toEqual('Monday, November 21st, 2022');
});
