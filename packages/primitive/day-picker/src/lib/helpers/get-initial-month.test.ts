import { addMonths, isSameMonth } from 'date-fns';

import { defaultDateLib } from '@/lib/classes/date-lib';
import { getInitialMonth } from '@/lib/helpers/get-initial-month';

describe('when no endMonth is given', () => {
  describe('when month is in context', () => {
    const month = new Date(2010, 11, 12);

    test('return that month', () => {
      const startMonth = getInitialMonth({ month }, defaultDateLib);

      expect(isSameMonth(startMonth, month)).toBe(true);
    });
  });
  describe('when defaultMonth is in context', () => {
    const defaultMonth = new Date(2010, 11, 12);

    test('return that month', () => {
      const startMonth = getInitialMonth({ defaultMonth }, defaultDateLib);

      expect(isSameMonth(startMonth, defaultMonth)).toBe(true);
    });
  });
  describe('when no month or defaultMonth', () => {
    const today = new Date(2010, 11, 12);

    test('return the today month', () => {
      const startMonth = getInitialMonth({ today }, defaultDateLib);

      expect(isSameMonth(startMonth, today)).toBe(true);
    });
  });
});
describe('when endMonth is given', () => {
  describe('when endMonth is before the default initial date', () => {
    const month = new Date(2010, 11, 12);
    const endMonth = addMonths(month, -2);

    describe('when the number of month is 1', () => {
      test('return the endMonth', () => {
        const startMonth = getInitialMonth({ endMonth, month }, defaultDateLib);

        expect(isSameMonth(startMonth, endMonth)).toBe(true);
      });
    });
    describe('when the number of month is 3', () => {
      test('return the endMonth plus the number of months', () => {
        const startMonth = getInitialMonth({ endMonth, month, numberOfMonths: 3 }, defaultDateLib);
        const expectedMonth = addMonths(endMonth, -1 * (3 - 1));

        expect(isSameMonth(startMonth, expectedMonth)).toBe(true);
      });
    });
  });
});
