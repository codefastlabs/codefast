/**
 * Utility function for handling errors consistently across use cases and repositories.
 * @param error - The error object or unknown value.
 * @param defaultMessage - Default message to display if an error message is unavailable.
 */
export function handleError(error: unknown, defaultMessage: string): void {
  const message = error instanceof Error ? error.message : defaultMessage;

  console.error(`\n❌ ${message}`);
}
