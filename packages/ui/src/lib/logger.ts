import type { ChalkInstance } from 'chalk';

import chalk from 'chalk';

type LogLevel = 'error' | 'info' | 'log' | 'success' | 'warn';

type LogMethod = (...args: unknown[]) => void;

interface Logger {
  error: LogMethod;
  info: LogMethod;
  log: LogMethod;
  success: LogMethod;
  warn: LogMethod;
}

const levels: Record<LogLevel, ChalkInstance> = {
  error: chalk.bgHex('#ef4444').hex('#450a0a').bold,
  info: chalk.bgHex('#06b6d4').hex('#083344').bold,
  log: chalk.bgHex('#64748b').hex('#020617').bold,
  success: chalk.bgHex('#22c55e').hex('#052e16').bold,
  warn: chalk.bgHex('#eab308').hex('#422006').bold,
};

const messages: Record<LogLevel, ChalkInstance> = {
  error: chalk.hex('#ef4444'),
  info: chalk.hex('#06b6d4'),
  log: chalk.hex('#64748b'),
  success: chalk.hex('#22c55e'),
  warn: chalk.hex('#eab308'),
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
function formatLog(level: LogLevel, tag: null | string, ...args: unknown[]): string {
  // Level with colors
  const levelPart = levels[level](` ${level.toUpperCase()} `);
  // Tag if available
  const tagPart = tag ? chalk.magenta(` ${tag} `) : '';
  // Combine all arguments into one string
  const messagePart = args.map((arg) => messages[level](typeof arg === 'string' ? arg : safeStringify(arg))).join(' ');

  return [levelPart, tagPart, messagePart].filter(Boolean).join(' ');
}

/**
 * Create a logger instance with optional tag support.
 * The tag is useful for distinguishing logs from different modules or contexts.
 *
 * @param tag - A string used as a tag in the log messages or null if no tag is desired.
 * @returns An object containing methods for logging messages at various levels.
 */
function createLogger(tag: null | string = null): Logger {
  return {
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
  };
}

export const logger: Logger = createLogger();

export const loggerWithTag = (tag: string): Logger => createLogger(tag);
