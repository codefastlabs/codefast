import { inject, injectable } from "inversify";
import path from "node:path";

import type { FileSystemPort } from "@/application/ports/file-system.port";

import { TYPES } from "@/ioc/types";

@injectable()
export class FileSystemUtility {
  constructor(@inject(TYPES.FileSystemPort) private fileSystemPort: FileSystemPort) {}

  /**
   * Updates the file content if a condition is met.
   *
   * @param filePath - The path of the file to potentially update.
   * @param checkFn - A function that determines if the current content needs updating.
   *                  It takes the current content as input and returns a boolean indicating whether an update is
   *   necessary.
   * @param updateFn - A function that generates new content for the file based on its current content.
   *                   It takes the current content as input and returns the updated content as output.
   *
   * This method checks if the specified file exists in the file system. If it does, it reads the current content of
   *   the file and uses `checkFn` to determine whether an update is required. If `checkFn` returns true, indicating no
   *   updates are needed, a log message is displayed. Otherwise, `updateFn` is used to generate new content for the
   *   file. The file system is then updated with this new content, and a success message is logged. In case of an
   *   error during the update process, a warning message is logged instead.
   *
   * @returns void - This method does not return any value.
   */
  updateFileIfNeeded(
    filePath: string,
    checkFn: (content: string) => boolean,
    updateFn: (content: string) => string,
  ): void {
    if (!this.fileSystemPort.exists(filePath)) {
      return;
    }

    const currentContent = this.fileSystemPort.readFile(filePath);

    if (checkFn(currentContent)) {
      console.log(`ℹ️ ${filePath} is already up to date`);

      return;
    }

    try {
      const updatedContent = updateFn(currentContent);

      this.fileSystemPort.writeFile(filePath, updatedContent);
      console.log(`📝 Updated ${filePath}`);
    } catch (error) {
      console.warn(`⚠️ Failed to update ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  /**
   * Backs up a file to a specified backup directory with a timestamped filename.
   *
   * @param filePath - The path of the file to be backed up.
   * @param backupDir - The name of the subdirectory under the original file's directory where the backup should be
   *   stored. This directory will be created if it does not exist.
   *
   * @returns void
   */
  backupFile(filePath: string, backupDir: string): void {
    try {
      const content = this.fileSystemPort.readFile(filePath);
      const baseName = path.basename(filePath);
      const timestamp = new Date().toISOString().replaceAll(/[:.]/g, "-");
      const backupPath = path.join(path.dirname(filePath), backupDir, `${baseName}.backup.${timestamp}`);

      this.fileSystemPort.createDirectory(path.dirname(backupPath));
      this.fileSystemPort.writeFile(backupPath, content);
    } catch (error) {
      console.error(`Error backing up ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }
}
