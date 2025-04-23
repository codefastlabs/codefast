import { injectable } from "inversify";
import fs from "node:fs";
import path from "node:path";

import type { FileSystemPort } from "@/application/ports/file-system.port";
import type { ConfigGroups } from "@/domain/entities/config-file";

@injectable()
export class NodeFileSystemAdapter implements FileSystemPort {
  exists(filePath: string): boolean {
    return fs.existsSync(filePath);
  }

  access(filePath: string): void {
    fs.accessSync(filePath, fs.constants.W_OK);
  }

  readFile(filePath: string): string {
    try {
      return fs.readFileSync(filePath, "utf8");
    } catch (error) {
      throw new Error(`Failed to read file ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`);
    }
  }

  writeFile(filePath: string, content: string): void {
    try {
      const dir = path.dirname(filePath);

      this.createDirectory(dir);
      fs.writeFileSync(filePath, content);
    } catch (error) {
      throw new Error(
        `Failed to write to file ${filePath}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  createDirectory(dirPath: string): void {
    if (!this.exists(dirPath)) {
      fs.mkdirSync(dirPath, { recursive: true });
    }
  }

  writeConfigFile(filePath: string, content: string): void {
    this.writeFile(filePath, content);
    console.log(`📝 Created ${filePath}`);
  }

  createConfigFiles(projectDir: string, configGroups: ConfigGroups): void {
    console.log(`\n📝 Creating configuration files...`);

    for (const [category, configs] of Object.entries(configGroups)) {
      console.log(`\n📂 Setting up ${category} configurations:`);

      for (const config of configs) {
        const fullPath = path.join(projectDir, config.path);

        this.writeConfigFile(fullPath, config.content);

        if (config.description) {
          console.log(`ℹ️ ${config.path}: ${config.description}`);
        }
      }
    }
  }
}
