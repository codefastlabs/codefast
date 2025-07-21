/**
 * Fast-Glob File System Service Adapter
 *
 * Infrastructure implementation of the file system service using fast-glob.
 * Following explicit architecture guidelines for CLI applications.
 */

import chalk from "chalk";
import pkg from "fast-glob";
import { injectable } from "inversify";

import type { FileSystemSystemPort } from "@/core/application/ports/system/file-system.system.port";

const { glob } = pkg;

@injectable()
export class FastGlobFileSystemSystemAdapter implements FileSystemSystemPort {
  async findFiles(pattern: string, options?: { ignore?: string[] }): Promise<string[]> {
    try {
      const files = await glob(pattern, {
        ignore: options?.ignore ?? ["node_modules/**", "dist/**", "**/*.d.ts"],
      });

      return files;
    } catch (error) {
      console.error(`Error finding files: ${String(error)}`);

      return [];
    }
  }

  async pathExists(pattern: string): Promise<boolean> {
    try {
      const matches = await glob(pattern);

      return matches.length > 0;
    } catch {
      return false;
    }
  }

  formatFileSize(bytes: number): string {
    const sizes = ["Bytes", "KB", "MB", "GB", "TB", "PB"];

    if (bytes === 0) return "0 Bytes";

    const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), sizes.length - 1);

    return String(Math.round((bytes / Math.pow(1024, index)) * 100) / 100) + " " + sizes[index];
  }

  createProgressIndicator(total: number): { increment: () => void; finish: () => void } {
    let current = 0;

    return {
      finish(): void {
        process.stdout.write("\n");
      },
      increment(): void {
        current++;
        const percentage = Math.round((current / total) * 100);
        const bar =
          "█".repeat(Math.floor(percentage / 5)) + "░".repeat(20 - Math.floor(percentage / 5));

        process.stdout.write(
          `\r${chalk.cyan(`[${bar}]`)} ${String(percentage)}% (${String(current)}/${String(total)})`,
        );
      },
    };
  }
}
