import type { DropdownOption } from '@/components/ui/dropdown';
import type { DateLib } from '@/lib/classes/date-lib';
import type { Formatters } from '@/lib/types';

/**
 * Return the years to show in the dropdown.
 */
export function getYearOptions(
  displayMonth: Date,
  calendarStart: Date | undefined,
  calendarEnd: Date | undefined,
  formatters: Pick<Formatters, 'formatYearDropdown'>,
  dateLib: DateLib,
): DropdownOption[] | undefined {
  if (!calendarStart || !calendarEnd) {
    return undefined;
  }

  const { addYears, endOfYear, isBefore, isSameYear, startOfMonth, startOfYear } = dateLib;
  const month = displayMonth.getMonth();
  const firstNavYear = startOfYear(calendarStart);
  const lastNavYear = endOfYear(calendarEnd);
  const years: number[] = [];

  let yearIterator = firstNavYear;

  while (isBefore(yearIterator, lastNavYear) || isSameYear(yearIterator, lastNavYear)) {
    years.push(yearIterator.getFullYear());
    yearIterator = addYears(yearIterator, 1);
  }

  return years.map((value) => {
    const year = new dateLib.Date(value, month);
    const disabled = year < startOfMonth(calendarStart) || (month && year > startOfMonth(calendarEnd)) || false;
    const label = formatters.formatYearDropdown(value);

    return {
      disabled,
      label,
      value,
    };
  });
}
