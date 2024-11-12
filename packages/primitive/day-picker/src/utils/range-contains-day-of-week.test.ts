import { defaultDateLib } from '@/classes/date-lib';
import { rangeContainsDayOfWeek } from '@/utils/range-contains-day-of-week';

const sunday = new Date(2024, 8, 1); //  day of the week 0
const monday = new Date(2024, 8, 2); //  day of the week 1
const friday = new Date(2024, 8, 6); //  day of the week 5
const saturday = new Date(2024, 8, 7); //  day of the week 6
const nextWeekSunday = new Date(2024, 8, 8); //  day of the week 0

describe('should return false', () => {
  const testCases: [{ from: Date; to: Date }, number | number[]][] = [
    [{ from: monday, to: saturday }, 0],
    [{ from: monday, to: friday }, [0, 6]],
    [{ from: sunday, to: friday }, 6],
  ];

  for (const [range, dayOfWeek] of testCases) {
    it(`range from ${range.from.toString()} to ${range.to.toString()} should not contain ${JSON.stringify(dayOfWeek)}`, () => {
      expect(rangeContainsDayOfWeek(range, dayOfWeek, defaultDateLib)).toBe(false);
    });
  }
});

describe('should return true', () => {
  const testCases: [{ from: Date; to: Date }, number | number[]][] = [
    [{ from: sunday, to: saturday }, 0],
    [{ from: monday, to: friday }, 1],
    [{ from: monday, to: friday }, 2],
    [{ from: monday, to: friday }, 3],
    [{ from: monday, to: friday }, 4],
    [{ from: monday, to: friday }, 5],
    [{ from: monday, to: saturday }, 6],
    [{ from: monday, to: saturday }, [0, 6]],
    [{ from: monday, to: nextWeekSunday }, 0],
    [{ from: monday, to: nextWeekSunday }, 6],
  ];

  for (const [range, dayOfWeek] of testCases) {
    it(`range from ${range.from.toString()} to ${range.to.toString()} should contain ${JSON.stringify(dayOfWeek)}`, () => {
      expect(rangeContainsDayOfWeek(range, dayOfWeek, defaultDateLib)).toBe(true);
    });
  }
});
