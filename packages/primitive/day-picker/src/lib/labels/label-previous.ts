/**
 * The ARIA label for previous month button.
 *
 * @defaultValue `"Go to the Previous Month"`
 */
export function labelPrevious(
  /**
   * `undefined` where there's no previous month to navigate to.
   */
  _month: Date | undefined,
): string {
  return 'Go to the Previous Month';
}
