import path from "node:path";
import { fileURLToPath } from "node:url";
import { inject, injectable } from "inversify";

import type { FileSystemPort } from "@/application/ports/file-system.port";
import { packageJsonSchema } from "@/domain/entities/package-config";
import type { PackageInfoServiceInterface } from "@/domain/interfaces/package-info.service";
import { TYPES } from "@/ioc/types";

@injectable()
export class NodePackageInfoService implements PackageInfoServiceInterface {
  constructor(@inject(TYPES.FileSystemPort) private fileSystemPort: FileSystemPort) {}

  getPackageVersion(): string {
    try {
      const __filename = fileURLToPath(import.meta.url);
      const __dirname = path.dirname(__filename);
      const packageJsonPath = path.resolve(__dirname, "..", "package.json");
      const packageJsonResult = packageJsonSchema.parse(JSON.parse(this.fileSystemPort.readFile(packageJsonPath)));

      return packageJsonResult.version ?? "0.0.0";
    } catch (error) {
      console.warn(`Failed to read package version: ${error instanceof Error ? error.message : "Unknown error"}`);

      return "unknown";
    }
  }
}
