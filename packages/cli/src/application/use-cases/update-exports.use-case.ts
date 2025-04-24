import { inject, injectable } from "inversify";

import type { PackageRepository } from "@/domain/interfaces/package.repository";

import { handleError } from "@/application/utilities/error-handler";
import { TYPES } from "@/ioc/types";

@injectable()
export class UpdateExportsUseCase {
  constructor(@inject(TYPES.PackageRepository) private packageRepository: PackageRepository) {}

  /**
   * Updates exports for all packages based on provided options and configuration.
   * @param options - Options for dry run, config path, and package filter.
   */
  async execute(options: { dryRun: boolean; configPath?: string; packageFilter?: string }): Promise<void> {
    try {
      console.info("♢‒ Searching for packages...");
      const packageJsonPaths = await this.packageRepository.findAllPackages(options.configPath);

      if (packageJsonPaths.length === 0) {
        console.warn("No packages found.");

        return;
      }

      console.log(` Found ${packageJsonPaths.length} packages.`);

      let successCount = 0;
      let skipCount = 0;
      let errorCount = 0;

      for (const packageJsonPath of packageJsonPaths) {
        const result = this.packageRepository.processPackage(packageJsonPath, options);

        if (result) {
          successCount++;
        } else if (options.packageFilter) {
          skipCount++;
        } else {
          errorCount++;
        }
      }

      console.log("♢‒ Completed exports update.\n");
      console.info(`Stats: ${successCount} succeeded, ${skipCount} skipped, ${errorCount} failed`);
    } catch (error) {
      handleError(error, "Error processing packages");
      throw error;
    }
  }
}
