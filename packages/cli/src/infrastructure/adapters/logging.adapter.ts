/**
 * Logging Service Adapter
 *
 * Infrastructure implementation of the logging service using chalk for colored output.
 * Following explicit architecture guidelines for CLI applications.
 */

import chalk from "chalk";
import { injectable } from "inversify";

import type { LoggingService } from "@/core/application/ports/logging.port";

@injectable()
export class ChalkLoggingAdapter implements LoggingService {
  debug(message: string): void {
    console.log(chalk.gray(`◎ ${message}`));
  }

  error(message: string): void {
    console.log(chalk.red(`✗ ${message}`));
  }

  info(message: string): void {
    console.log(chalk.blue(`ℹ ${message}`));
  }

  plain(message: string): void {
    console.log(message);
  }

  success(message: string): void {
    console.log(chalk.green(`✓ ${message}`));
  }

  warning(message: string): void {
    console.log(chalk.yellow(`⚠ ${message}`));
  }

  // Vertical Flow UI Methods
  startSection(title: string): void {
    console.log(chalk.cyan(`◆  ${title}`));
  }

  step(message: string): void {
    console.log(chalk.gray(`│`));
    console.log(chalk.blue(`◇  ${message}`));
  }

  continue(message: string): void {
    console.log(chalk.gray(`│  ${message}`));
  }

  item(message: string, level = 1): void {
    const indent = "  ".repeat(level);

    console.log(chalk.gray(`│${indent}${message}`));
  }

  result(message: string, status: "error" | "success" | "warning"): void {
    const symbol = status === "success" ? "✓" : status === "error" ? "✗" : "⚠";
    const color =
      status === "success" ? chalk.green : status === "error" ? chalk.red : chalk.yellow;

    console.log(chalk.gray(`│  `) + color(`${symbol} ${message}`));
  }

  spacing(): void {
    console.log(chalk.gray(`│`));
  }
}
