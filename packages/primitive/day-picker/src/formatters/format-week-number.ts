/**
 * Format the week number.
 *
 * @defaultValue `weekNumber.toLocaleString()` with a leading zero for single-digit numbers
 */
export function formatWeekNumber(weekNumber: number) {
  if (weekNumber < 10) {
    return `0${weekNumber.toLocaleString()}`;
  }

  return weekNumber.toLocaleString();
}
