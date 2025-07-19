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
    console.log(chalk.gray(`🐛 ${message}`));
  }

  error(message: string): void {
    console.log(chalk.red(`❌ ${message}`));
  }

  info(message: string): void {
    console.log(chalk.blue(`ℹ ${message}`));
  }

  success(message: string): void {
    console.log(chalk.green(`✅ ${message}`));
  }

  warning(message: string): void {
    console.log(chalk.yellow(`⚠️ ${message}`));
  }
}
