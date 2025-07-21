/**
 * Fast Glob File Finder Adapter
 *
 * Infrastructure adapter that implements FileFinderServicePort using fast-glob library.
 * Following explicit architecture guidelines for CLI applications.
 */

import fg from "fast-glob";
import { injectable } from "inversify";

import type {
  FileFinderOptions,
  FileFinderServicePort,
} from "@/core/application/ports/services/file-finder.service.port";

@injectable()
export class FastGlobFileFinderAdapter implements FileFinderServicePort {
  async findFiles(patterns: string | string[], options: FileFinderOptions = {}): Promise<string[]> {
    const globOptions: fg.Options = {
      absolute: options.absolute ?? true,
      cwd: options.cwd,
      deep: options.deep,
      followSymbolicLinks: options.followSymbolicLinks ?? false,
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
      onlyFiles: options.onlyFiles ?? true,
    };

    try {
      const files = await fg(patterns, globOptions);

      return files;
    } catch (error) {
      throw new Error(`Failed to find files with pattern "${Array.isArray(patterns) ? patterns.join(', ') : patterns}": ${String(error)}`);
    }
  }

  findFilesSync(patterns: string | string[], options: FileFinderOptions = {}): string[] {
    const globOptions: fg.Options = {
      absolute: options.absolute ?? true,
      cwd: options.cwd,
      deep: options.deep,
      followSymbolicLinks: options.followSymbolicLinks ?? false,
      ignore: ["**/node_modules/**", "**/dist/**", "**/.git/**"],
      onlyFiles: options.onlyFiles ?? true,
    };

    try {
      const files = fg.sync(patterns, globOptions);

      return files;
    } catch (error) {
      throw new Error(`Failed to find files with pattern "${Array.isArray(patterns) ? patterns.join(', ') : patterns}": ${String(error)}`);
    }
  }

  async hasFiles(pattern: string, options: FileFinderOptions = {}): Promise<boolean> {
    const files = await this.findFiles(pattern, { ...options, deep: 1 });

    return files.length > 0;
  }
}
