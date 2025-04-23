import { inject, injectable } from "inversify";
import path from "node:path";

import type { FileSystemPort } from "@/application/ports/file-system.port";
import type { PackageInfoServiceInterface } from "@/domain/interfaces/package-info.service";

import { TYPES } from "@/ioc/types";

@injectable()
export class NodePackageInfoService implements PackageInfoServiceInterface {
  constructor(@inject(TYPES.FileSystemPort) private fileSystemPort: FileSystemPort) {}

  getPackageVersion(): string {
    try {
      const packageJsonPath = path.resolve(process.cwd(), "package.json");
      const packageJsonContent = this.fileSystemPort.readFile(packageJsonPath);
      const packageJson = JSON.parse(packageJsonContent);

      return packageJson.version ?? "0.0.0";
    } catch (error) {
      console.warn(`Failed to read package version: ${error instanceof Error ? error.message : "Unknown error"}`);

      return "unknown";
    }
  }
}
