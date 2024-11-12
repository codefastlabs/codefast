import { type DateLib } from '@/lib/classes/date-lib';
import { type DayPickerProps } from '@/lib/types';

export function getDisplayMonths(
  firstDisplayedMonth: Date,
  calendarEndMonth: Date | undefined,
  props: Pick<DayPickerProps, 'numberOfMonths'>,
  dateLib: DateLib,
): Date[] {
  const { numberOfMonths = 1 } = props;
  const months: Date[] = [];

  for (let i = 0; i < numberOfMonths; i++) {
    const month = dateLib.addMonths(firstDisplayedMonth, i);

    if (calendarEndMonth && month > calendarEndMonth) {
      break;
    }

    months.push(month);
  }

  return months;
}
