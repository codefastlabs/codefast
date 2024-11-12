import { labelNext } from '@/labels/label-next';

test('should return the label', () => {
  expect(labelNext(new Date())).toEqual('Go to the Next Month');
});
