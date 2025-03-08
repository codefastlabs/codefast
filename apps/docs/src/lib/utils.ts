/**
 * Converts a kebab-case string to a title case string.
 *
 * @param name - The kebab-case string to be converted.
 * @returns The converted string in title case.
 */
export function getComponentName(name: string): string {
  return name.replaceAll('-', ' ').replaceAll(/\b\w/g, (char) => char.toUpperCase());
}
