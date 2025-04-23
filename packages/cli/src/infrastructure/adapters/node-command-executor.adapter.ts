import { inject, injectable } from "inversify";
import { execSync } from "node:child_process";
import path from "node:path";

import type { CommandExecutorPort } from "@/application/ports/command-executor.port";
import type { FileSystemPort } from "@/application/ports/file-system.port";
import type { DependencyConfigServiceInterface } from "@/domain/interfaces/dependency-config.service";

import { PackageJson, PackageJsonSchema } from "@/domain/entities/package-config";
import { TYPES } from "@/ioc/types";

@injectable()
export class NodeCommandExecutorAdapter implements CommandExecutorPort {
  constructor(
    @inject(TYPES.FileSystemPort) private fileSystemPort: FileSystemPort,
    @inject(TYPES.DependencyConfigService) private dependencyConfigService: DependencyConfigServiceInterface,
  ) {}

  runCommand(command: string): void {
    execSync(command, { stdio: "inherit" });
  }

  checkEnvironment(): void {
    try {
      this.runCommand("pnpm --version");
    } catch {
      throw new Error("PNPM is not installed. Please install PNPM first.");
    }
  }

  installDependencies(): void {
    console.log(`\n📚 Installing dependencies...`);
    const mainDependencies = this.dependencyConfigService.getMainDependencies();

    if (mainDependencies.length > 0) {
      this.runCommand(`pnpm add ${mainDependencies.join(" ")}`);
    }

    const devDependencies = this.dependencyConfigService.getDevDependencies();
    const allDevDependencies = Object.values(devDependencies).flat().join(" ");

    if (allDevDependencies) {
      this.runCommand(`pnpm add -D ${allDevDependencies}`);
    }
  }

  cleanupPackages(): void {
    console.log(`\n🧹 Cleaning up unnecessary packages...`);
    const packageJsonPath = path.join(process.cwd(), "package.json");

    if (!this.fileSystemPort.exists(packageJsonPath)) {
      console.warn(`⚠️ package.json not found, skipping cleanup.`);

      return;
    }

    let packageJson: PackageJson | undefined;

    try {
      const result = PackageJsonSchema.safeParse(JSON.parse(this.fileSystemPort.readFile(packageJsonPath)));

      if (!result.success) {
        return;
      }

      packageJson = result.data;
    } catch (error) {
      console.warn(
        `⚠️ Error reading package.json: ${error instanceof Error ? error.message : "Unknown error"}, skipping cleanup.`,
      );

      return;
    }

    const dependencies = packageJson.dependencies ?? {};
    const devDependencies = packageJson.devDependencies ?? {};
    const packagesToRemove = this.dependencyConfigService
      .getPackagesToRemove()
      .filter((pkg) => pkg in dependencies || pkg in devDependencies);

    if (packagesToRemove.length > 0) {
      this.runCommand(`pnpm remove ${packagesToRemove.join(" ")}`);
    } else {
      console.log(`ℹ️ No unnecessary packages found in package.json to remove.`);
    }
  }

  enableGitHooks(): void {
    console.log(`\n🔄 Activating git hooks...`);
    this.runCommand("pnpm simple-git-hooks");
  }

  runFormatter(): void {
    console.log(`\n📝 Formatting files with Prettier...`);
    this.runCommand("pnpm format");
  }

  runLinter(): void {
    console.log(`\n🔍 Running ESLint to check code style...`);
    this.runCommand("pnpm lint");
  }
}
