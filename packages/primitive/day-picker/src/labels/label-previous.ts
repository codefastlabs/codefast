/**
 * The ARIA label for previous month button.
 *
 * @defaultValue `"Go to the Previous Month"`
 */
export function labelPrevious(
  /** Undefined where there's no previous month to navigate to. */
  month: Date | undefined,
) {
  return 'Go to the Previous Month';
}