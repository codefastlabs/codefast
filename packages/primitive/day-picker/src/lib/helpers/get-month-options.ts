import { type DropdownOption } from '@/components/ui/dropdown';
import { type DateLib } from '@/lib/classes/date-lib';
import { type Formatters } from '@/lib/types';

/** Return the months to show in the dropdown. */
export function getMonthOptions(
  displayMonth: Date,
  navStart: Date | undefined,
  navEnd: Date | undefined,
  formatters: Pick<Formatters, 'formatMonthDropdown'>,
  dateLib: DateLib,
): DropdownOption[] | undefined {
  if (!navStart || !navEnd) {
    return undefined;
  }

  const { addMonths, startOfMonth, isBefore } = dateLib;
  const year = displayMonth.getFullYear();

  const months: number[] = [];
  let monthIterator = navStart;

  while (months.length < 12 && isBefore(monthIterator, addMonths(navEnd, 1))) {
    months.push(monthIterator.getMonth());
    monthIterator = addMonths(monthIterator, 1);
  }

  const sortedMonths = months.sort((a, b) => a - b);

  return sortedMonths.map((value) => {
    const label = formatters.formatMonthDropdown(value, dateLib.options.locale);
    const month = new dateLib.Date(year, value);
    const disabled = month < startOfMonth(navStart) || month > startOfMonth(navEnd) || false;

    return { value, label, disabled };
  });
}
