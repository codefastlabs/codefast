import { labelPrevious } from '@/lib/labels/label-previous';

test('should return the label', () => {
  expect(labelPrevious(new Date())).toEqual('Go to the Previous Month');
});
