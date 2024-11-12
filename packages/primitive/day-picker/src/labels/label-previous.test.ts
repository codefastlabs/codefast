import { labelPrevious } from '@/labels/label-previous';

test('should return the label', () => {
  expect(labelPrevious(new Date())).toEqual('Go to the Previous Month');
});
