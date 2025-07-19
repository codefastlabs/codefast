/**
 * Logging Service Port
 *
 * Interface for logging functionality following explicit architecture guidelines.
 * This port abstracts logging operations from the infrastructure implementation.
 */

export interface LoggingService {
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
   * Log success messages
   */
  success: (message: string) => void;

  /**
   * Log warning messages
   */
  warning: (message: string) => void;
}
