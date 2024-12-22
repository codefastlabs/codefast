import chalk from 'chalk';

type LogMethod = (...args: unknown[]) => void;

interface Logger {
  error: LogMethod;
  info: LogMethod;
  log: LogMethod;
  success: LogMethod;
  warn: LogMethod;
}

const levels = {
  error: chalk.bgBlack.red,
  info: chalk.bgBlack.cyan,
  log: chalk.bgBlack.white,
  success: chalk.bgBlack.green,
  warn: chalk.bgBlack.yellow,
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
  try {
    return JSON.stringify(obj);
  } catch {
    return '[Circular or Invalid Object]';
  }
}

/**
 * Formats the log message with color-coded levels, optional tags, and the main
 * message.
 * - Level: Displays the log level (for example, INFO, SUCCESS) in a styled
 * format.
 * - Tag: Optionally includes a tag (for example, module name) for better
 * context.
 * - Message: The actual log content.
 *
 * @param level - Log level (for example, 'info', 'error').
 * @param tag - Optional context tag.
 * @param args - Log message parts.
 * @returns Formatted log string for output.
 */
function formatLog(level: keyof typeof levels, tag: null | string, ...args: unknown[]): string {
  // Level with colors
  const levelPart = levels[level](` ${level.toUpperCase()} `);
  // Tag if available
  const tagPart = tag ? chalk.magenta(` ${tag} `) : '';
  // Combine all arguments into one string
  const messagePart = args.map((arg) => (typeof arg === 'string' ? arg : safeStringify(arg))).join(' ');

  return [levelPart, tagPart, messagePart].filter(Boolean).join(' ');
}

// Create a logger instance with optional tag support.
// The tag is useful for distinguishing logs from different modules or contexts.
const createLogger = (tag: null | string = null): Logger => ({
  error: (...args: unknown[]): void => {
    console.error(formatLog('error', tag, ...args));
  },
  info: (...args: unknown[]): void => {
    console.log(formatLog('info', tag, ...args));
  },
  log: (...args: unknown[]): void => {
    console.log(formatLog('log', tag, ...args));
  },
  success: (...args: unknown[]): void => {
    console.log(formatLog('success', tag, ...args));
  },
  warn: (...args: unknown[]): void => {
    console.warn(formatLog('warn', tag, ...args));
  },
});

export const logger: Logger = createLogger();

export const loggerWithTag = (tag: string): Logger => createLogger(tag);
