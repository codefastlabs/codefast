import { DateLib, defaultDateLib } from '@/lib/classes/date-lib';
import { getDates } from '@/lib/helpers/get-dates';

describe('getDates Helper Function', () => {
  describe('when the first month and the last month are the same', () => {
    describe('and the month has 6 weeks', () => {
      const month = new Date(2023, 11, 1);

      describe('and fixed weeks are disabled', () => {
        test('should return 42 dates spanning the correct range', () => {
          const dates = getDates([month], undefined, { fixedWeeks: false }, defaultDateLib);

          expect(dates).toHaveLength(42);
          expect(dates[0]).toEqual(new Date(2023, 10, 26)); // First day
          expect(dates[dates.length - 1]).toEqual(new Date(2024, 0, 6)); // Last day
        });
      });

      describe('and fixed weeks are enabled', () => {
        test('should return 42 dates spanning the correct range', () => {
          const dates = getDates([month], undefined, { fixedWeeks: true }, defaultDateLib);

          expect(dates).toHaveLength(42);
          expect(dates[0]).toEqual(new Date(2023, 10, 26)); // First day
          expect(dates[dates.length - 1]).toEqual(new Date(2024, 0, 6)); // Last day
        });
      });
    });

    describe('and the month has 5 weeks', () => {
      const month = new Date(2023, 4, 1);

      describe('and fixed weeks are disabled', () => {
        test('should return 35 dates spanning the correct range', () => {
          const dates = getDates([month], undefined, { fixedWeeks: false }, defaultDateLib);

          expect(dates).toHaveLength(35);
          expect(dates[0]).toEqual(new Date(2023, 3, 30)); // First day
          expect(dates[dates.length - 1]).toEqual(new Date(2023, 5, 3)); // Last day
        });
      });

      describe('and fixed weeks are enabled', () => {
        test('should return 42 dates spanning the correct range', () => {
          const dates = getDates([month], undefined, { fixedWeeks: true }, defaultDateLib);

          expect(dates).toHaveLength(42);
          expect(dates[0]).toEqual(new Date(2023, 3, 30)); // First day
          expect(dates[dates.length - 1]).toEqual(new Date(2023, 5, 10)); // Last day
        });
      });
    });

    describe('and Monday is the first day of the week', () => {
      const month = new Date(2023, 4, 1);

      test('should set the first day as Monday', () => {
        const dates = getDates([month], undefined, {}, new DateLib({ weekStartsOn: 1 }));

        expect(dates[0]).toBeMonday();
        expect(dates[0]).toEqual(new Date(2023, 4, 1)); // First day
        expect(dates[dates.length - 1]).toEqual(new Date(2023, 5, 4)); // Last day
      });
    });

    describe('and a max date is provided', () => {
      const month = new Date(2023, 4, 1);
      const maxDate = new Date(2023, 4, 15);

      test('should limit the last day to the max date', () => {
        const dates = getDates([month], maxDate, {}, new DateLib({ weekStartsOn: 1 }));

        expect(dates).toHaveLength(15);
        expect(dates[dates.length - 1]).toEqual(maxDate); // Max date
      });
    });

    describe('and ISO weeks are enabled', () => {
      const month = new Date(2023, 4, 1);

      test('should set the first day as Monday', () => {
        const dates = getDates([month], undefined, { ISOWeek: true }, defaultDateLib);

        expect(dates[0]).toBeMonday();
        expect(dates[0]).toEqual(new Date(2023, 4, 1)); // First day
        expect(dates[dates.length - 1]).toEqual(new Date(2023, 5, 4)); // Last day
      });
    });
  });

  describe('when the first month and the last month are different', () => {
    const firstMonth = new Date(2023, 4, 1);
    const lastMonth = new Date(2023, 11, 1);

    describe('and fixed weeks are disabled', () => {
      test('should return dates spanning multiple months without fixed weeks', () => {
        const dates = getDates([firstMonth, lastMonth], undefined, { fixedWeeks: false }, defaultDateLib);

        expect(dates).toHaveLength(252);
        expect(dates[0]).toEqual(new Date(2023, 3, 30)); // First day
        expect(dates[dates.length - 1]).toEqual(new Date(2024, 0, 6)); // Last day
      });
    });

    describe('and a max date is provided', () => {
      const maxDate = new Date(2023, 5, 15);

      test('should limit the last day to the max date', () => {
        const dates = getDates([firstMonth, lastMonth], maxDate, {}, new DateLib({ weekStartsOn: 1 }));

        expect(dates).toHaveLength(46);
        expect(dates[dates.length - 1]).toEqual(maxDate); // Max date
      });
    });

    describe('and ISO weeks are enabled', () => {
      const month = new Date(2023, 4, 1);

      test('should set the first day as Monday', () => {
        const dates = getDates([month], undefined, { ISOWeek: true }, defaultDateLib);

        expect(dates[0]).toBeMonday();
        expect(dates[0]).toEqual(new Date(2023, 4, 1)); // First day
        expect(dates[dates.length - 1]).toEqual(new Date(2023, 5, 4)); // Last day
      });
    });
  });
});
