import { type DateLib } from '@/classes/date-lib';
import { type DateAfter, type DateBefore, type DateInterval, type DateRange, type DayOfWeek } from '@/types';

/**
 * Returns true if `matcher` is of type {@link DateInterval}.
 *
 */
export function isDateInterval(matcher: unknown): matcher is DateInterval {
  return Boolean(matcher && typeof matcher === 'object' && 'before' in matcher && 'after' in matcher);
}

/**
 * Returns true if `value` is a {@link DateRange} type.
 *
 */
export function isDateRange(value: unknown): value is DateRange {
  return Boolean(value && typeof value === 'object' && 'from' in value);
}

/**
 * Returns true if `value` is of type {@link DateAfter}.
 *
 */
export function isDateAfterType(value: unknown): value is DateAfter {
  return Boolean(value && typeof value === 'object' && 'after' in value);
}

/**
 * Returns true if `value` is of type {@link DateBefore}.
 *
 */
export function isDateBeforeType(value: unknown): value is DateBefore {
  return Boolean(value && typeof value === 'object' && 'before' in value);
}

/**
 * Returns true if `value` is a {@link DayOfWeek} type.
 *
 */
export function isDayOfWeekType(value: unknown): value is DayOfWeek {
  return Boolean(value && typeof value === 'object' && 'dayOfWeek' in value);
}

/**
 * Returns true if `value` is an array of valid dates.
 *
 * @private
 */
export function isDatesArray(value: unknown, dateLib: DateLib): value is Date[] {
  return Array.isArray(value) && value.every(dateLib.isDate);
}
