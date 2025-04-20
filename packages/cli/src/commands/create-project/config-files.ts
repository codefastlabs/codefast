import fs from "node:fs";
import path from "node:path";

import { configGroups } from "@/commands/create-project/constants";
import { writeConfigFile } from "@/commands/create-project/utils";

/**
 * Updates the PostCSS configuration file in the specified project directory by adding a type comment for improved
 * editor support.
 *
 * This function checks if a `postcss.config.mjs` file exists in the provided directory.
 * If the file is found, it determines whether the type comment for PostCSS configuration has already been added.
 * If the type comment is missing, it updates the file by inserting the comment above the configuration object
 * definition.
 *
 * @param projectDir - The root directory of the project where the `postcss.config.mjs` file is located
 * @returns void
 */
export function updatePostcssConfig(projectDir: string): void {
  const postcssConfigPath = path.join(projectDir, "postcss.config.mjs");

  if (!fs.existsSync(postcssConfigPath)) {
    console.warn(`⚠️ postcss.config.mjs not found, skipping update.`);

    return;
  }

  let content = fs.readFileSync(postcssConfigPath, "utf8");
  const typeComment = `/** @type {import('postcss-load-config').Config} */\n`;

  // Check if the comment already exists to avoid adding duplicates.
  if (content.includes(typeComment)) {
    console.log(`📝 postcss.config.mjs already contains type comment, no changes made.`);
  } else {
    content = content.replace("const config = {", `${typeComment}const config = {`);
    fs.writeFileSync(postcssConfigPath, content);
    console.log(`📝 Updated postcss.config.mjs with type comment.`);
  }
}

/**
 * Updates the scripts and hooks in the package.json file of the specified project directory.
 * Adds formatting, linting, pre-commit, and commit-msg hooks to the package.json configuration.
 *
 * @param projectDir - The path to the project directory containing the package.json file
 * @returns void
 */
export function updatePackageJson(projectDir: string): void {
  const packageJsonPath = path.join(projectDir, "package.json");
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

  packageJson.scripts = {
    ...packageJson.scripts,
    format: 'prettier --write "**/*.{js,mjs,jsx,ts,tsx,json,css,md,mdx}"',
    "format:check": 'prettier --check "**/*.{js,mjs,jsx,ts,tsx,json,css,md,mdx}"',
    "lint:check": "next lint --max-warnings 0",
  };

  packageJson["simple-git-hooks"] = {
    "pre-commit": "pnpm lint-staged",
    "commit-msg": "pnpm commitlint --edit",
  };

  fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log(`📝 Updated package.json`);
}

/**
 * Creates configuration files in the specified project directory.
 *
 * @param projectDir - The absolute path to the project directory where the configuration files will be created
 *
 * @returns Nothing.
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
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Write the configuration file and log its description
      writeConfigFile(fullPath, content);

      if (description) {
        console.log(`  ℹ️ ${filePath}: ${description}`);
      }
    }
  }
}

/**
 * Updates the layout file in a specified project directory by modifying font imports,
 * HTML tag properties, and body className to conform to the necessary changes for using `fontVariables` and
 * applying proper configurations.
 *
 * @param projectDir - The root directory of the project where the layout file resides.
 * @returns void - This function does not return a value.
 */
export function updateLayoutFile(projectDir: string): void {
  const layoutPath = path.join(projectDir, "src/app/layout.tsx");

  if (!fs.existsSync(layoutPath)) {
    console.warn(`⚠️ src/app/layout.tsx not found, skipping update.`);

    return;
  }

  let content = fs.readFileSync(layoutPath, "utf8");

  // Check if the file already uses fontVariables in <html> tag
  if (content.includes('<html className={cn(fontVariables, "antialiased")} lang="en">')) {
    console.log(`📝 src/app/layout.tsx already uses fontVariables in html tag, no changes made.`);

    return;
  }

  // Replace font imports and definitions with fontVariables import
  const newImports = `import type { Metadata } from "next";

import { cn } from "@codefast/ui";

import { fontVariables } from "@/lib/fonts";
import "@/app/globals.css";`;

  // Remove existing font imports and definitions
  content = content.replaceAll(/import\s+{[^}]+}\s+from\s+["']next\/font\/google["'];\s*/g, "");
  content = content.replace(/const\s+geistSans\s*=[^;]+;\s*const\s+geistMono\s*=[^;]+;\s*/, "");
  content = content.replace(
    /import\s+type\s+{[^}]+}\s+from\s+["']next["'];\s*import\s+["']\.\/globals\.css["'];\s*/,
    newImports,
  );

  // Update the HTML tag to include className and remove className from the BODY
  const htmlRegex = /<html\s+lang="en"\s*>/;
  const newHtml = `<html className={cn(fontVariables, "antialiased")} lang="en">`;

  content = content.replace(htmlRegex, newHtml);

  const bodyRegex = /<body\s+className={`[^`]*`}\s*>/;
  const newBody = `<body>`;

  content = content.replace(bodyRegex, newBody);

  try {
    fs.writeFileSync(layoutPath, content);
    console.log(`📝 Updated src/app/layout.tsx to use fontVariables in html tag and removed className from body`);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

    console.warn(`⚠️ Failed to update src/app/layout.tsx: ${errorMessage}`);
  }
}
