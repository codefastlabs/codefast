import { glob } from "glob";
import { inject, injectable } from "inversify";
import { merge } from "lodash-es";
import path from "node:path";

import type { AnalysisPort } from "@/application/ports/analysis.port";
import type { FileSystemPort } from "@/application/ports/file-system.port";
import type { AnalysisResult, PackageConfig, PackageExports, ScriptConfig } from "@/domain/entities/package-config";
import type { PackageRepository } from "@/domain/interfaces/package.repository";
import type { FileSystemUtility } from "@/infrastructure/utilities/file-system-utility";

import { PackageJsonSchema, ScriptConfigSchema } from "@/domain/entities/package-config";
import { TYPES } from "@/ioc/types";

@injectable()
export class FileSystemPackageRepository implements PackageRepository {
  private readonly DEFAULT_IGNORE_PATTERN = ["**/node_modules/**"];
  private cachedConfig: null | ScriptConfig = null;
  private defaultConfig: ScriptConfig = {
    packagesGlob: "./packages/**/package.json",
    defaultPackageConfig: {
      cjsOutputPattern: "./dist/cjs/{dir}/{name}.cjs",
      esmOutputPattern: "./dist/esm/{dir}/{name}.js",
      packageJsonPath: "package.json",
      srcIndexPath: "src/index.ts",
      typesOutputCjsPattern: "./dist/types/{dir}/{name}.d.ts",
      typesOutputPattern: "./dist/types/{dir}/{name}.d.ts",
    },
    customPackageConfigs: {
      "@codefast/ui": {
        exportPathPrefixesToRemove: ["components"],
      },
      "@codefast/style-guide": {
        exportPathPrefixesToRemove: ["configs"],
      },
    },
  };

  constructor(
    @inject(TYPES.FileSystemPort) private fileSystemPort: FileSystemPort,
    @inject(TYPES.AnalysisPort) private analysisPort: AnalysisPort,
    @inject(TYPES.FileSystemUtility) private fileSystemUtility: FileSystemUtility,
  ) {}

  async findAllPackages(config: PackageConfig): Promise<string[]> {
    return await glob(config.packageJsonPath, {
      ignore: this.DEFAULT_IGNORE_PATTERN,
    });
  }

  processPackage(
    packageJsonPath: string,
    options: {
      dryRun: boolean;
      configPath?: string;
      packageFilter?: string;
    },
  ): boolean {
    const packageDir = path.dirname(packageJsonPath);
    const packageJsonContent = this.fileSystemPort.readFile(packageJsonPath);
    const packageJsonResult = PackageJsonSchema.safeParse(JSON.parse(packageJsonContent));

    if (!packageJsonResult.success) {
      console.error(`Failed to parse ${packageJsonPath}: ${packageJsonResult.error.message}`);

      return false;
    }

    const packageJson = packageJsonResult.data;
    const packageName = packageJson.name;

    if (options.packageFilter && packageName !== options.packageFilter) {
      console.debug(`Skipping ${packageName} (does not match filter)`);

      return false;
    }

    console.info(`Processing package: ${packageName}`);

    const config = this.getConfig(options.configPath);
    const packageConfig = this.getPackageConfig(packageName, config);
    const srcIndexPath = path.join(packageDir, packageConfig.srcIndexPath);

    if (!this.fileSystemPort.exists(srcIndexPath)) {
      console.error(`Source file not found at ${srcIndexPath}`);

      return false;
    }

    console.info(`Analyzing imports from ${srcIndexPath}...`);
    const analysis = this.analyzeImports(srcIndexPath, packageConfig);

    if (analysis.imports.length === 0) {
      console.warn(`No imports found to analyze in ${packageName}`);

      return false;
    }

    console.log(`Analysis complete. Found ${analysis.imports.length} subpath exports.`);

    this.saveExportsAnalysis(packageDir, analysis);

    const newExports = this.generateExports(packageName, analysis.imports, packageJson.exports ?? {}, config);

    const currentExportsCount = packageJson.exports ? Object.keys(packageJson.exports).length : 0;
    const newExportsCount = Object.keys(newExports).length;

    console.info(`Exports: ${currentExportsCount} -> ${newExportsCount}`);

    if (options.dryRun) {
      this.saveExportsPreview(packageDir, newExports);
      console.warn(`Saved exports preview to .exports-analysis`);
      console.warn(`Dry run: no changes saved for ${packageName}`);

      return true;
    }

    this.fileSystemUtility.backupFile(packageJsonPath, ".exports-analysis");
    console.log(`Backed up ${packageJsonPath}`);

    const updatedPackageJson = { ...packageJson, exports: newExports };

    this.fileSystemPort.writeFile(packageJsonPath, JSON.stringify(updatedPackageJson, null, 2));
    console.log(`Updated exports for ${packageName}`);

    return true;
  }

  analyzeImports(indexFilePath: string, packageConfig: PackageConfig): AnalysisResult {
    return this.analysisPort.analyzeImports(indexFilePath, packageConfig);
  }

  generateExports(
    packageName: string,
    imports: AnalysisResult["imports"],
    existingExports: PackageExports,
    config: ScriptConfig,
  ): PackageExports {
    const packageConfig = this.getPackageConfig(packageName, config);
    const exports: PackageExports = {
      ".": existingExports["."] ?? {
        import: {
          types: "./dist/types/index.d.ts",
          default: "./dist/esm/index.js",
        },
        require: {
          types: "./dist/types/index.d.cts",
          default: "./dist/cjs/index.cjs",
        },
      },
    };

    if (existingExports["./styles.css"]) {
      exports["./styles.css"] = existingExports["./styles.css"];
    }

    for (const importPath of imports) {
      const { directory, name, exportPath } = importPath;
      const esmOutput = this.formatOutputPath(packageConfig.esmOutputPattern, directory, name);
      const cjsOutput = this.formatOutputPath(packageConfig.cjsOutputPattern, directory, name);
      const typesOutput = this.formatOutputPath(packageConfig.typesOutputPattern, directory, name);
      const typesCjsOutput = this.formatOutputPath(packageConfig.typesOutputCjsPattern, directory, name);

      exports[exportPath] = {
        import: {
          types: typesOutput,
          default: esmOutput,
        },
        require: {
          types: typesCjsOutput,
          default: cjsOutput,
        },
      };
    }

    return exports;
  }

  private getConfig(configPath?: string): ScriptConfig {
    if (this.cachedConfig && !configPath) {
      return this.cachedConfig;
    }

    const userConfig = this.loadConfigFile(configPath);
    const config = merge({}, this.defaultConfig, userConfig) as ScriptConfig;

    if (!configPath) {
      this.cachedConfig = config;
    }

    return config;
  }

  private loadConfigFile(configPath?: string): Partial<ScriptConfig> {
    if (!configPath) {
      return {};
    }

    try {
      const fullPath = path.resolve(configPath);

      if (!this.fileSystemPort.exists(fullPath)) {
        console.warn(`Configuration file not found at ${fullPath}`);

        return {};
      }

      const configContent = this.fileSystemPort.readFile(fullPath);

      return ScriptConfigSchema.parse(JSON.parse(configContent));
    } catch (error) {
      console.error(`Error reading configuration file: ${error instanceof Error ? error.message : "Unknown error"}`);

      return {};
    }
  }

  private getPackageConfig(packageName: string, config: ScriptConfig): PackageConfig {
    const customConfig = config.customPackageConfigs[packageName] ?? {};

    return { ...config.defaultPackageConfig, ...customConfig };
  }

  private formatOutputPath(pattern: string, directory: string, name: string): string {
    const dirPart = directory === "." ? "" : `${directory}/`;

    return pattern.replace("{dir}/", dirPart).replace("{dir}", directory).replace("{name}", name);
  }

  private saveExportsAnalysis(packageDir: string, analysis: AnalysisResult): void {
    const outputDir = path.join(packageDir, ".exports-analysis");

    this.fileSystemPort.createDirectory(outputDir);
    this.fileSystemPort.writeFile(path.join(outputDir, "exports-analysis.json"), JSON.stringify(analysis, null, 2));
  }

  private saveExportsPreview(packageDir: string, exports: PackageExports): void {
    const outputDir = path.join(packageDir, ".exports-analysis");

    this.fileSystemPort.createDirectory(outputDir);
    this.fileSystemPort.writeFile(path.join(outputDir, "exports-preview.json"), JSON.stringify(exports, null, 2));
  }
}
