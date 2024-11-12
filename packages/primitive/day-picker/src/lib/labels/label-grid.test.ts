import { labelGrid } from '@/lib/labels/label-grid';

const day = new Date(2022, 10, 21);

test('return the label', () => {
  expect(labelGrid(day)).toEqual('November 2022');
});
