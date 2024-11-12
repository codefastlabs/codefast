import { defaultDateLib } from '@/lib/classes';
import { rangeIncludesDate } from '@/lib/utils/range-includes-date';

/**
 * Determines whether a given range overlaps with another range.
 */
export function rangeOverlaps(
  rangeLeft: { from: Date; to: Date },
  rangeRight: { from: Date; to: Date },
  dateLib = defaultDateLib,
): boolean {
  return (
    rangeIncludesDate(rangeLeft, rangeRight.from, false, dateLib) ||
    rangeIncludesDate(rangeLeft, rangeRight.to, false, dateLib) ||
    rangeIncludesDate(rangeRight, rangeLeft.from, false, dateLib) ||
    rangeIncludesDate(rangeRight, rangeLeft.to, false, dateLib)
  );
}
