import glob from "fast-glob";
import { injectable } from "inversify";
import { promises as fs } from "node:fs";
import * as path from "node:path";

import type { FileSystemPort } from "../../application/ports/file-system.port";

@injectable()
export class FileSystemAdapter implements FileSystemPort {
  async findFiles(directory: string, pattern: string): Promise<string[]> {
    try {
      const absoluteDirectory = path.resolve(directory);
      const fullPattern = path.join(absoluteDirectory, pattern);

      const files = await glob(fullPattern, {
        absolute: true,
        ignore: [
          "**/node_modules/**",
          "**/dist/**",
          "**/.next/**",
          "**/coverage/**",
          // Next.js App Router files (should use default exports)
          "**/app/**/page.tsx",
          "**/app/**/layout.tsx",
          "**/app/**/loading.tsx",
          "**/app/**/error.tsx",
          "**/app/**/not-found.tsx",
          "**/app/**/global-error.tsx",
          "**/app/**/template.tsx",
          "**/app/**/default.tsx",
          // Registry and example files (may have different export patterns)
          "**/registry/**",
          "**/examples/**",
          // Test files
          "**/*.test.tsx",
          "**/*.spec.tsx",
          // Story files
          "**/*.stories.tsx",
        ],
        onlyFiles: true,
      });

      return files;
    } catch (error) {
      throw new Error(`Failed to find files in ${directory} with pattern ${pattern}: ${error}`);
    }
  }

  async readFile(filePath: string): Promise<string> {
    try {
      return await fs.readFile(filePath, "utf8");
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error}`);
    }
  }

  async fileExists(filePath: string): Promise<boolean> {
    try {
      await fs.access(filePath);

      return true;
    } catch {
      return false;
    }
  }

  async isDirectory(path: string): Promise<boolean> {
    try {
      const stats = await fs.stat(path);

      return stats.isDirectory();
    } catch {
      return false;
    }
  }

  getAbsolutePath(inputPath: string): string {
    return path.resolve(inputPath);
  }
}
