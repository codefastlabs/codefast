import chalk from "chalk";

interface LoggerOptions {
  verbose?: boolean;
}

export class Logger {
  private readonly verbose: boolean;

  constructor(options: LoggerOptions = {}) {
    this.verbose = options.verbose ?? false;
  }

  info(message: string, ...args: any[]): void {
    console.log(chalk.blue(message), ...args);
  }

  success(message: string, ...args: any[]): void {
    console.log(chalk.green(message), ...args);
  }

  warn(message: string, ...args: any[]): void {
    console.log(chalk.yellow(message), ...args);
  }

  error(message: string, ...args: any[]): void {
    console.error(chalk.red(message), ...args);
  }

  debug(message: string, ...args: any[]): void {
    if (this.verbose) {
      console.log(chalk.gray(message), ...args);
    }
  }

  table(data: any[]): void {
    console.table(data);
  }
}
