import fs from "node:fs";
import path from "node:path";

import { configGroups } from "@/commands/create-project/constants";
import { FileUtils, getErrorMessage } from "@/commands/create-project/utils";

/**
 * Updates a file if it exists and doesn't already have the specified modifications
 */
function updateFileIfNeeded(
  filePath: string,
  filename: string,
  checkFn: (content: string) => boolean,
  updateFn: (content: string) => string,
  successMessage: string,
  alreadyUpdatedMessage: string,
): void {
  if (!FileUtils.validatePath(filePath, filename)) {
    return;
  }

  const content = FileUtils.readFile(filePath);

  if (checkFn(content)) {
    console.log(`📝 ${alreadyUpdatedMessage}`);

    return;
  }

  try {
    const updatedContent = updateFn(content);

    FileUtils.writeFile(filePath, updatedContent);
    console.log(`📝 ${successMessage}`);
  } catch (error) {
    console.warn(`⚠️ Failed to update ${filename}: ${getErrorMessage(error)}`);
  }
}

/**
 * Updates the PostCSS configuration file by adding a type comment for improved editor support
 */
export function updatePostcssConfig(projectDir: string): void {
  const postcssConfigPath = path.join(projectDir, "postcss.config.mjs");
  const typeComment = `/** @type {import('postcss-load-config').Config} */\n`;

  updateFileIfNeeded(
    postcssConfigPath,
    "postcss.config.mjs",
    (content) => content.includes(typeComment),
    (content) => content.replace("const config = {", `${typeComment}const config = {`),
    "Updated postcss.config.mjs with type comment.",
    "postcss.config.mjs already contains type comment, no changes made.",
  );
}

/**
 * Updates the layout file to use fontVariables and apply proper configurations
 */
export function updateLayoutFile(projectDir: string): void {
  const layoutPath = path.join(projectDir, "src/app/layout.tsx");
  const htmlTarget = '<html className={cn(fontVariables, "antialiased")} lang="en">';

  updateFileIfNeeded(
    layoutPath,
    "src/app/layout.tsx",
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
    "Updated src/app/layout.tsx to use fontVariables in html tag, removed className from body, modified ReactNode import, and added return type to RootLayout",
    "src/app/layout.tsx already uses fontVariables in html tag, no changes made.",
  );
}

/**
 * Updates the scripts and hooks in the package.json file
 */
export function updatePackageJson(projectDir: string): void {
  const packageJsonPath = path.join(projectDir, "package.json");

  if (!FileUtils.validatePath(packageJsonPath, "package.json")) {
    return;
  }

  try {
    const packageJson = JSON.parse(FileUtils.readFile(packageJsonPath));

    packageJson.scripts = {
      ...packageJson.scripts,
      "check-types": "tsc --noEmit",
      "deploy:preview": "vercel deploy --archive=tgz",
      "deploy:prod": "vercel deploy --archive=tgz --prod",
      format: "prettier --write --ignore-unknown .",
      "format:check": "prettier --check --ignore-unknown .",
      lint: "next lint --fix --max-warnings 0",
      "lint:check": "next lint --max-warnings 0",
      "package:install": "pnpm install",
      "package:outdated": "pnpm outdated",
      "package:upgrade": "pnpm update --latest",
      preview: "pnpm build && pnpm start",
    };

    packageJson["simple-git-hooks"] = {
      "pre-commit": "pnpm lint-staged",
      "commit-msg": "pnpm commitlint --edit",
    };

    FileUtils.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    console.log(`📝 Updated package.json`);
  } catch (error) {
    console.warn(`⚠️ Failed to update package.json: ${getErrorMessage(error)}`);
  }
}

/**
 * Updates the Next.js configuration file to add experimental optimizePackageImports
 */
export function updateNextConfig(projectDir: string): void {
  const nextConfigPath = path.join(projectDir, "next.config.ts");
  const optimizePackagesConfig = 'optimizePackageImports: ["@codefast/ui"]';

  updateFileIfNeeded(
    nextConfigPath,
    "next.config.ts",
    (content) => content.includes(optimizePackagesConfig),
    (content) =>
      content.replace(
        /const nextConfig: NextConfig = \{/,
        `const nextConfig: NextConfig = {
  experimental: {
    optimizePackageImports: ["@codefast/ui"],
  },`,
      ),
    "Updated next.config.ts with optimizePackageImports configuration.",
    "next.config.ts already contains optimizePackageImports configuration, no changes made.",
  );
}

/**
 * Updates the page.tsx file by adding JSX.Element return type to the Home component
 */
export function updatePageFile(projectDir: string): void {
  const pagePath = path.join(projectDir, "src/app/page.tsx");

  updateFileIfNeeded(
    pagePath,
    "src/app/page.tsx",
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
    "Updated src/app/page.tsx to add JSX.Element return type to Home component",
    "src/app/page.tsx already has JSX.Element return type, no changes made.",
  );
}

/**
 * Creates configuration files in the specified project directory
 */
export function createConfigFiles(projectDir: string): void {
  console.log(`\n📝 Creating configuration files...`);

  // Iterate through each configuration category (linting, formatting, styles)
  for (const [category, configs] of Object.entries(configGroups)) {
    console.log(`\n📂 Setting up ${category} configurations:`);

    for (const { path: filePath, content, description } of configs) {
      const fullPath = path.join(projectDir, filePath);
      const dir = path.dirname(fullPath);

      // Create a directory if it doesn't exist
      if (!FileUtils.exists(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the configuration file and log its description
      FileUtils.writeConfigFile(fullPath, content);

      if (description) {
        console.log(`  ℹ️ ${filePath}: ${description}`);
      }
    }
  }
}
