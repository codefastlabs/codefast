import fs from "node:fs";
import path from "node:path";

import { configFiles } from "@/commands/create-project/constants";
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

  for (const [filePath, content] of Object.entries(configFiles)) {
    const fullPath = path.join(projectDir, filePath);
    const dir = path.dirname(fullPath);

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    writeConfigFile(fullPath, content);
  }
}
