/**
 * Format the years for the dropdown option label.
 *
 * @defaultValue `year.toString()`
 */
export function formatYearDropdown(year: number): string {
  return year.toString();
}

/**
 * @private
 * @deprecated Use `formatYearDropdown` instead.
 */
export const formatYearCaption = formatYearDropdown;