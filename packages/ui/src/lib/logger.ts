import type { ChalkInstance } from 'chalk';

import chalk from 'chalk';

/**
 * Defines the supported log levels for the logger.
 * - `debug`: Used for low-level debug messages.
 * - `error`: Used for error messages.
 * - `info`: Used for informational messages.
 * - `log`: Used for general log messages.
 * - `success`: Used for success messages.
 * - `warn`: Used for warning messages.
 * - `trace`: Used for tracing operations or in-depth debugging.
 * - `fatal`: Used for high-priority, critical error messages.
 */
type LogLevel = 'debug' | 'error' | 'fatal' | 'info' | 'log' | 'success' | 'trace' | 'warn';

/**
 * Type definition for a log method used in a logger.
 * - Accepts a variable number of arguments.
 * - Each argument can be of any type.
 */
type LogMethod = (...args: unknown[]) => void;

/**
 * Interface representing a logger with various log levels.
 */
interface Logger {
  /**
   * Logs a debug message.
   * @param args - One or more arguments to log as a debug message.
   */
  debug: LogMethod;

  /**
   * Logs an error message.
   * @param args - One or more arguments to log as an error.
   */
  error: LogMethod;

  /**
   * Logs a fatal error message.
   * @param args - One or more arguments to log as a critical error.
   */
  fatal: LogMethod;

  /**
   * Logs an informational message.
   * @param args - One or more arguments to log as information.
   */
  info: LogMethod;

  /**
   * Logs a general message.
   * @param args - One or more arguments to log as a standard message.
   */
  log: LogMethod;

  /**
   * Logs a success message.
   * @param args - One or more arguments to log as a success.
   */
  success: LogMethod;

  /**
   * Logs a trace message.
   * @param args - One or more arguments to log as a trace message.
   */
  trace: LogMethod;

  /**
   * Logs a warning message.
   * @param args - One or more arguments to log as a warning.
   */
  warn: LogMethod;
}

/**
 * A record mapping log levels to their respective ChalkInstance for
 * styled formatting in logs.
 */
const levels: Record<LogLevel, ChalkInstance> = {
  error: chalk.bgHex('#ef4444').hex('#450a0a').bold, // Red background for errors
  info: chalk.bgHex('#06b6d4').hex('#083344').bold, // Blue background for info
  log: chalk.bgHex('#ffffff').hex('#020617').bold, // White background for logs
  success: chalk.bgHex('#22c55e').hex('#052e16').bold, // Green background for success
  warn: chalk.bgHex('#eab308').hex('#422006').bold, // Yellow background for warnings
  debug: chalk.bgHex('#a855f7').hex('#38017a').bold, // Purple background for debugging
  trace: chalk.bgHex('#14b8a6').hex('#064e3b').bold, // Teal background for traces
  fatal: chalk.bgHex('#b91c1c').hex('#450a0a').bold, // Dark red background for fatal errors
};

/**
 * A record mapping log levels to their plain text ChalkInstance for
 * message body formatting.
 */
const messages: Record<LogLevel, ChalkInstance> = {
  error: chalk.hex('#ef4444'), // Red text
  info: chalk.hex('#06b6d4'), // Blue text
  log: chalk.hex('#ffffff'), // White text
  success: chalk.hex('#22c55e'), // Green text
  warn: chalk.hex('#eab308'), // Yellow text
  debug: chalk.hex('#a855f7'), // Purple text
  trace: chalk.hex('#14b8a6'), // Teal text
  fatal: chalk.hex('#b91c1c'), // Dark red text
};

/**
 * Safely converts a given object into a JSON string representation.
 * If the object contains circular references or can't be stringified,
 * it returns a fallback string.
 *
 * @param obj - The object to be stringified.
 * @returns A JSON string representation of the object, or a fallback string
 * indicating the presence of circular references or invalid structure.
 */
function safeStringify(obj: unknown): string {
  if (obj instanceof Error) {
    return [chalk.italic(obj.message), obj.stack || '[No Stack]'].join('\n');
  }

  try {
    return JSON.stringify(obj, null, 2);
  } catch {
    return '[Circular or Invalid Object]';
  }
}

/**
 * Formats the log message with color-coded levels, optional tags, and the main
 * message.
 *
 * Components of the formatted message:
 * 1. Level: Displays the log level (for example, INFO, SUCCESS) in a styled format.
 * 2. Tag: Optionally includes a tag (for example, module name) for better context.
 * 3. Message: The actual log content.
 *
 * @param level - Log level (for example, 'info', 'error').
 * @param tag - Optional context tag.
 * @param args - Log message parts.
 * @returns Formatted log string for output.
 */
function formatLog(level: LogLevel, tag: null | string, ...args: unknown[]): string {
  /** Styled representation of the log level. */
  const levelPart = levels[level](` ${level.toUpperCase()} `);

  /** Optional tag for contextual identification in the log message. */
  const tagPart = tag ? chalk.magenta(` ${tag} `) : '';

  /** Combines all arguments into a single styled message string. */
  const messagePart = args.map((arg) => messages[level](typeof arg === 'string' ? arg : safeStringify(arg))).join(' ');

  return [levelPart, tagPart, messagePart].filter(Boolean).join(' ');
}

/**
 * Creates a logger instance with optional tag support.
 * The optional tag is useful for distinguishing logs from different modules or contexts.
 *
 * @param tag - A string used as a tag in the log messages or null if no tag is desired.
 * @returns An object containing methods for logging messages at various levels.
 */
function createLogger(tag: null | string = null): Logger {
  /**
   * Logs an error message.
   */
  const error = (...args: unknown[]): void => {
    console.error(formatLog('error', tag, ...args));
  };

  /**
   * Logs an informational message.
   */
  const info = (...args: unknown[]): void => {
    console.info(formatLog('info', tag, ...args));
  };

  /**
   * Logs a general log message.
   */
  const log = (...args: unknown[]): void => {
    console.log(formatLog('log', tag, ...args));
  };

  /**
   * Logs a success message.
   */
  const success = (...args: unknown[]): void => {
    console.log(formatLog('success', tag, ...args));
  };

  /**
   * Logs a warning message.
   */
  const warn = (...args: unknown[]): void => {
    console.warn(formatLog('warn', tag, ...args));
  };

  /**
   * Logs a debug message.
   */
  const debug = (...args: unknown[]): void => {
    console.debug(formatLog('debug', tag, ...args));
  };

  /**
   * Logs a trace message for detailed contextual information.
   */
  const trace = (...args: unknown[]): void => {
    console.trace(formatLog('trace', tag, ...args));
  };

  /**
   * Logs a fatal error message, typically for critical errors.
   */
  const fatal = (...args: unknown[]): void => {
    console.error(formatLog('fatal', tag, ...args));
  };

  return {
    error,
    info,
    log,
    success,
    warn,
    debug,
    trace,
    fatal,
  };
}

/**
 * The default logger instance, which does not use a specific tag.
 */
export const logger: Logger = createLogger();

/**
 * Factory function to create a logger instance with a specific tag.
 *
 * @param tag - The tag to be included in all log messages.
 * @returns A logger instance configured with the provided tag.
 */
export const loggerWithTag = (tag: string): Logger => createLogger(tag);
