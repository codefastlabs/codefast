import path from "node:path";
import { inject, injectable } from "inversify";
import type { CommandExecutorPort } from "@/application/ports/command-executor.port";
import type { FileSystemPort } from "@/application/ports/file-system.port";
import type { PromptPort } from "@/application/ports/prompt.port";
import type { PackageJson } from "@/domain/entities/package-config";
import { packageJsonSchema } from "@/domain/entities/package-config";
import type { Project } from "@/domain/entities/project";
import { projectSchema } from "@/domain/entities/project";
import type { ProjectRepositoryInterface } from "@/domain/interfaces/project.repository";
import type { FileSystemUtility } from "@/infrastructure/utilities/file-system-utility";
import { TYPES } from "@/ioc/types";

@injectable()
export class FileSystemProjectRepository implements ProjectRepositoryInterface {
  constructor(
    @inject(TYPES.FileSystemPort) private fileSystemPort: FileSystemPort,
    @inject(TYPES.CommandExecutorPort) private commandExecutorPort: CommandExecutorPort,
    @inject(TYPES.PromptPort) private promptPort: PromptPort,
    @inject(TYPES.FileSystemUtility) private fileSystemUtility: FileSystemUtility,
  ) {}

  async checkExistingProject(projectName?: string): Promise<Project> {
    let fullPath = process.cwd();
    let name = "";
    const packageJsonPath = path.join(process.cwd(), "package.json");
    const packageJsonExists = this.fileSystemPort.exists(packageJsonPath);

    if (packageJsonExists) {
      const result = packageJsonSchema.safeParse(JSON.parse(this.fileSystemPort.readFile(packageJsonPath)));

      if (result.success) {
        name = result.data.name;
      }
    } else {
      name = await this.getValidProjectName(projectName);

      fullPath = path.resolve(process.cwd(), name);
    }

    return {
      name,
      directory: fullPath,
      packageJsonExists,
    };
  }

  createNextProject(projectName: string): void {
    const flags = [
      "--ts",
      "--tailwind",
      "--app",
      "--turbo",
      "--use-pnpm",
      "--src-dir",
      "--turbopack",
      '--import-alias "@/*"',
    ].join(" ");

    this.commandExecutorPort.runCommand(`npx create-next-app@latest ${projectName} ${flags}`);
  }

  updateLayoutFile(projectDir: string): void {
    const layoutPath = path.join(projectDir, "src", "app", "layout.tsx");
    const htmlTarget = '<html className={cn(fontVariables, "antialiased")} lang="en">';

    this.fileSystemUtility.updateFileIfNeeded(
      layoutPath,
      (content) => content.includes(htmlTarget),
      (content) => {
        // Import replacements
        const newImports = `import type { Metadata } from "next";
import type { JSX, ReactNode } from "react";
import { cn } from "@codefast/ui";
import { fontVariables } from "@/lib/fonts";
import "@/app/globals.css";`;

        let result = content;

        // Remove existing font imports and definitions
        result = result.replaceAll(/import\s+{[^}]+}\s+from\s+["']next\/font\/google["'];\s*/g, "");
        result = result.replace(/const\s+geistSans\s*=[^;]+;\s*const\s+geistMono\s*=[^;]+;\s*/, "");
        result = result.replace(
          /import\s+type\s+{[^}]+}\s+from\s+["']next["'];\s*import\s+["']\.\/globals\.css["'];\s*/,
          newImports,
        );

        // Update React.ReactNode to ReactNode and add a return type
        result = result.replace(
          /export default function RootLayout\({\s*children,\s*}\s*:\s*Readonly<{\s*children:\s*React\.ReactNode;\s*}>\)\s*{/,
          `export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {`,
        );

        // Update HTML and body tags
        result = result.replace(/<html\s+lang="en"\s*>/, htmlTarget);
        result = result.replace(/<body\s+className={`[^`]*`}\s*>/, `<body>`);

        return result;
      },
    );
  }

  updatePageFile(projectDir: string): void {
    const pagePath = path.join(projectDir, "src", "app", "page.tsx");

    this.fileSystemUtility.updateFileIfNeeded(
      pagePath,
      (content) => content.includes("): JSX.Element"),
      (content) => {
        let result = content;

        // Add JSX import if not present
        if (!result.includes("import type { JSX }")) {
          if (result.includes("import type {")) {
            // Add JSX to existing type import
            result = result.replace(
              /import type {(?<types>[^}]+)} from "react";/,
              'import type {$1, JSX } from "react";',
            );
          } else if (result.includes("import {")) {
            // Add type import before the first import
            result = result.replace(/import {/, 'import type { JSX } from "react";\n\nimport {');
          } else {
            // Add type import at the beginning of the file
            result = `import type { JSX } from "react";\n\n${result}`;
          }
        }

        // Add JSX.Element return type to the Home component
        result = result.replace(/export default function Home\(\) {/, "export default function Home(): JSX.Element {");

        return result;
      },
    );
  }

  updatePostcssConfig(projectDir: string): void {
    const postcssConfigPath = path.join(projectDir, "postcss.config.mjs");
    const typeComment = `/** @type {import('postcss-load-config').Config} */\n`;

    this.fileSystemUtility.updateFileIfNeeded(
      postcssConfigPath,
      (content) => content.includes(typeComment),
      (content) => content.replace("const config = {", `${typeComment}const config = {`),
    );
  }

  updateNextConfig(projectDir: string): void {
    const nextConfigPath = path.join(projectDir, "next.config.ts");
    const optimizePackagesConfig = 'optimizePackageImports: ["@codefast/ui"]';

    this.fileSystemUtility.updateFileIfNeeded(
      nextConfigPath,
      (content) => content.includes(optimizePackagesConfig),
      (content) =>
        content.replace(
          /const nextConfig: NextConfig = \{/,
          `const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@codefast/ui"],
  },`,
        ),
    );
  }

  updatePackageJson(projectDir: string): void {
    const packageJsonPath = path.join(projectDir, "package.json");

    if (!this.fileSystemPort.exists(packageJsonPath)) {
      console.warn(`⚠️ package.json not found, skipping update.`);

      return;
    }

    let packageJson: PackageJson | undefined;

    try {
      packageJson = packageJsonSchema.parse(JSON.parse(this.fileSystemPort.readFile(packageJsonPath)));
    } catch {
      console.warn(`Failed to parse ${packageJsonPath}, skipping update.`);

      return;
    }

    packageJson.scripts = {
      ...packageJson.scripts,
      "check-types": "tsc --noEmit",
      "deploy:preview": "vercel deploy --archive=tgz",
      "deploy:prod": "vercel deploy --archive=tgz --prod",
      format: "biome format --write .",
      "format:check": "biome format --check .",
      lint: "biome check --write .",
      "lint:check": "biome check .",
      "package:install": "pnpm install",
      "package:outdated": "pnpm outdated",
      "package:upgrade": "pnpm update --latest",
      preview: "pnpm build && pnpm start",
    };

    packageJson["simple-git-hooks"] = {
      "pre-commit": "pnpm lint-staged",
      "commit-msg": "pnpm commitlint --edit",
    };

    this.fileSystemPort.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`📝 Updated ${packageJsonPath}`);
  }

  private async getValidProjectName(initialName?: string, attempts = 0, maxAttempts = 3): Promise<string> {
    const projectName = initialName ?? (await this.promptPort.prompt("Enter project name: "));
    const result = projectSchema.safeParse({ name: projectName, directory: "", packageJsonExists: false });

    if (result.success) {
      const fullPath = path.resolve(process.cwd(), projectName);

      if (this.fileSystemPort.exists(fullPath)) {
        throw new Error(`A directory named "${projectName}" already exists.`);
      }

      try {
        this.fileSystemPort.access(process.cwd());
      } catch {
        throw new Error("Cannot create project: No write permission in current directory.");
      }

      return projectName;
    }

    if (attempts >= maxAttempts - 1) {
      throw new Error(`Exceeded maximum attempts to enter a valid project name.`);
    }

    console.error(`❌ ${result.error.message} (${maxAttempts - attempts - 1} attempts remaining)`);

    return this.getValidProjectName(undefined, attempts + 1, maxAttempts);
  }
}
