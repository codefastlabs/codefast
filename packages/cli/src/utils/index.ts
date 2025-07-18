import chalk from "chalk";
import { glob } from "fast-glob";

/**
 * Logger utility with colored output
 */
export const logger = {
  debug: (message: string): void => { console.log(chalk.gray(`🐛 ${message}`)); },
  error: (message: string): void => { console.log(chalk.red(`❌ ${message}`)); },
  info: (message: string): void => { console.log(chalk.blue(`ℹ ${message}`)); },
  success: (message: string): void => { console.log(chalk.green(`✅ ${message}`)); },
  warning: (message: string): void => { console.log(chalk.yellow(`⚠️ ${message}`)); },
};

/**
 * Check if a file or directory exists using glob patterns
 */
export async function pathExists(pattern: string): Promise<boolean> {
  try {
    const matches = await glob(pattern);

    return matches.length > 0;
  } catch {
    return false;
  }
}

/**
 * Format file size in human readable format
 */
export function formatFileSize(bytes: number): string {
  const sizes = ["Bytes", "KB", "MB", "GB"];

  if (bytes === 0) return "0 Bytes";

  const index = Math.floor(Math.log(bytes) / Math.log(1024));

  return String(Math.round(bytes / Math.pow(1024, index) * 100) / 100) + " " + sizes[index];
}

/**
 * Create a progress indicator
 */
export function createProgressIndicator(total: number): { finish: () => void; increment: () => void } {
  let current = 0;

  return {
    finish(): void {
      process.stdout.write("\n");
    },
    increment(): void {
      current++;
      const percentage = Math.round((current / total) * 100);
      const bar = "█".repeat(Math.floor(percentage / 5)) + "░".repeat(20 - Math.floor(percentage / 5));

      process.stdout.write(`\r${chalk.cyan(`[${bar}]`)} ${String(percentage)}% (${String(current)}/${String(total)})`);
    }
  };
}
