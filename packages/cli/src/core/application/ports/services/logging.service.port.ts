/**
 * Logging Service Port
 *
 * Interface for logging functionality following explicit architecture guidelines.
 * This port abstracts logging operations from the infrastructure implementation.
 */

export interface LoggingServicePort {
  /**
   * Log debug information
   */
  debug: (message: string) => void;

  /**
   * Log error messages
   */
  error: (message: string) => void;

  /**
   * Log informational messages
   */
  info: (message: string) => void;

  /**
   * Log plain messages without prefixes (for headers, separators, etc.)
   */
  plain: (message: string) => void;

  /**
   * Log success messages
   */
  success: (message: string) => void;

  /**
   * Log warning messages
   */
  warning: (message: string) => void;

  // Vertical Flow UI Methods
  /**
   * Start a new section with a diamond symbol (◆)
   */
  startSection: (title: string) => void;

  /**
   * Finish a section with a diamond symbol (◆)
   */
  finishSection: (title: string) => void;

  /**
   * Log a step with a circle symbol (◇)
   */
  step: (message: string) => void;

  /**
   * Log a continuation line with vertical bar (│)
   */
  continue: (message: string) => void;

  /**
   * Log an indented item
   */
  item: (message: string, level?: number) => void;

  /**
   * Log a result or status
   */
  result: (message: string, status: "error" | "success" | "warning") => void;

  /**
   * Add spacing between sections
   */
  spacing: () => void;
}
