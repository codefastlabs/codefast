/**
 * The ARIA label for next month button.
 *
 * @defaultValue `"Go to the Next Month"`
 */
export function labelNext(
  /** `undefined` where there is no next month to navigate to. */
  _month: Date | undefined,
): string {
  return 'Go to the Next Month';
}
