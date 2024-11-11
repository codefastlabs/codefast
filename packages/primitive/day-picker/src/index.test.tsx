import { add } from '@/index';

describe('add function', () => {
  it('returns the sum of two numbers', () => {
    expect(add(1, 2)).toEqual(3);
  });

  it('works with negative numbers', () => {
    expect(add(-1, -2)).toEqual(-3);
  });
});
