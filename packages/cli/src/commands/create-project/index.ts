import type { Command } from "commander";

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";

/**
 * Main dependencies need to be installed
 */
const MAIN_DEPENDENCIES = ["@codefast/ui", "@codefast/hooks"];

/**
 * Development dependencies are grouped by function.
 */
const DEV_DEPENDENCIES = {
  commitLint: ["@commitlint/cli", "@commitlint/config-conventional", "@commitlint/types"],
  gitTools: ["simple-git-hooks"],
  formatting: ["prettier", "prettier-plugin-packagejson", "prettier-plugin-tailwindcss", "lint-staged"],
  linting: ["@codefast/eslint-config"],
};

/**
 * Represents an interface for reading and writing data to the console or other input/output streams.
 *
 * This interface allows interaction with standard input and output streams by reading input and writing output
 * in a controlled manner. It is commonly used for creating command-line interfaces or handling user input.
 */
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

/**
 * Asks a user a question and returns their response as a trimmed string.
 *
 * @param question - The question to present to the user.
 * @returns A promise that resolves with the user's response as a trimmed string.
 */
function prompt(question: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer.trim());
    });
  });
}

/**
 * Checks the current environment to ensure PNPM is installed.
 * If PNPM is not detected, logs an error message and terminates the process.
 *
 * @returns void
 */
function checkEnvironment(): void {
  try {
    execSync("pnpm --version", { stdio: "ignore" });
  } catch {
    console.error("❌ PNPM chưa được cài đặt. Vui lòng cài đặt PNPM trước.");
    process.exit(1);
  }
}

/**
 * Validates the given project name against various criteria to ensure it is suitable for use.
 *
 * The validation checks include:
 * - Ensuring the name is not empty or comprised only of whitespace.
 * - Restricting the maximum length of the name to 100 characters.
 * - Enforcing URL-friendly naming conventions, prohibiting special characters such as `@` or names resembling scoped
 * packages.
 * - Preventing the use of prohibited project names such as '.' or '..'.
 * - Restricting the use of reserved system names on Windows.
 * - Ensuring that the specified project name does not conflict with an existing directory in the current working
 * directory.
 * - Verifying that the current directory has write permissions for the creation of a new project.
 *
 * @param name - The proposed project name to be validated.
 * @returns An object indicating whether the project name is valid. If invalid, an error message is provided.
 */
function validateProjectName(name: string): { valid: boolean; error?: string } {
  // Check if the name is empty or contains only spaces.
  if (!name || /^\s*$/.test(name)) {
    return { valid: false, error: "Project name cannot be empty or contain only whitespace." };
  }

  // Check the name length
  if (name.length > 100) {
    return { valid: false, error: "Project name is too long (maximum 100 characters)." };
  }

  // Check the package name format according to npm standard (scoped packages are not allowed).
  const npmNameRegex = /^[a-z0-9-~][a-z0-9-._~]*$/;

  if (!npmNameRegex.test(name)) {
    return {
      valid: false,
      error:
        "Project name must be URL-friendly (letters, numbers, hyphens, underscores, dots; no @ or scoped packages).",
    };
  }

  // Check if the name contains only dots.
  if (name === "." || name === "..") {
    return { valid: false, error: "Project name cannot be '.' or '..'." };
  }

  // Checking system keywords on Windows
  const reservedNames = /^(?<reserved>CON|PRN|AUX|NUL|COM[1-9]|LPT[1-9])$/i;

  if (reservedNames.test(name)) {
    return { valid: false, error: `Project name "${name}" is a reserved system name.` };
  }

  // Check the existence of the directory
  const fullPath = path.resolve(process.cwd(), name);

  if (fs.existsSync(fullPath)) {
    return { valid: false, error: `A directory named "${name}" already exists.` };
  }

  // Check write permission
  try {
    fs.accessSync(process.cwd(), fs.constants.W_OK);
  } catch {
    return { valid: false, error: "Cannot create project: No write permission in current directory." };
  }

  return { valid: true };
}

/**
 * Asynchronously prompts the user to enter a valid project name, validating the input and retrying up to a specified
 * number of attempts if necessary.
 *
 * @param initialName - An optional initial project name to validate; if not provided, the user will be prompted to
 *   enter a name.
 * @param attempts - The current number of validation attempts made. Defaults to 0.
 * @param maxAttempts - The maximum number of validation attempts allowed. Defaults to 3.
 * @returns A promise that resolves to a valid project name as a string.
 * @throws An error if the maximum number of validation attempts is exceeded.
 */
async function getValidProjectName(initialName?: string, attempts = 0, maxAttempts = 3): Promise<string> {
  const projectName = initialName ?? (await prompt("Enter project name: "));

  const validation = validateProjectName(projectName);

  if (validation.valid) {
    return projectName;
  }

  if (attempts >= maxAttempts - 1) {
    throw new Error("❌ Exceeded maximum attempts to enter a valid project name.");
  }

  console.error(`❌ ${validation.error} (${maxAttempts - attempts - 1} attempts remaining)`);

  return getValidProjectName(undefined, attempts + 1, maxAttempts);
}

/**
 * Executes a shell command synchronously and inherits the output behavior of the current process.
 *
 * @param command - The shell command to be executed.
 * @returns void
 */
function runCommand(command: string): void {
  execSync(command, { stdio: "inherit" });
}

/**
 * Writes configuration content to a specified file.
 *
 * @param filePath - The path of the file where the configuration content should be written.
 * @param content - The configuration content to write into the file.
 * @returns void
 */
function writeConfigFile(filePath: string, content: string): void {
  fs.writeFileSync(filePath, content);
  console.log(`📝 Created ${filePath}`);
}

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
function updatePostcssConfig(projectDir: string): void {
  const postcssConfigPath = path.join(projectDir, "postcss.config.mjs");

  if (!fs.existsSync(postcssConfigPath)) {
    console.warn("⚠️ postcss.config.mjs not found, skipping update.");

    return;
  }

  let content = fs.readFileSync(postcssConfigPath, "utf8");
  const typeComment = `/** @type {import('postcss-load-config').Config} */\n`;

  // Check if the comment already exists to avoid adding duplicates.
  if (content.includes(typeComment)) {
    console.log("📝 postcss.config.mjs already contains type comment, no changes made.");
  } else {
    content = content.replace("const config = {", `${typeComment}const config = {`);
    fs.writeFileSync(postcssConfigPath, content);
    console.log("📝 Updated postcss.config.mjs with type comment.");
  }
}

/**
 * Represents a collection of configuration files for various tools and libraries.
 *
 * This object maps file paths to the corresponding configuration file content
 * or definitions. Each entry in the map provides tools such as commitlint, Prettier,
 * ESLint, or lint-staged with the necessary configuration for project usage.
 *
 * @typeParam K - The type of keys in the configuration map, representing file paths.
 * @typeParam V - The type of values in the configuration map, representing file content.
 * @param configFiles - A mapping of configuration file names to their respective content as strings.
 *   This enables centralized management of configuration files used across the project.
 */
const configFiles: Record<string, string> = {
  "commitlint.config.mjs": `/**
 * @see https://commitlint.js.org/reference/configuration.html
 * @type {import('@commitlint/types').UserConfig}
 */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 350],
  },
};

export default config;
`,
  "prettier.config.mjs": `/**
 * @see https://prettier.io/docs/en/configuration.html
 * @type {import('prettier').Config}
 */
const config = {
  plugins: ["prettier-plugin-packagejson", "prettier-plugin-tailwindcss"],
  printWidth: 100,
  tailwindAttributes: ["classNames"],
  tailwindFunctions: ["tv"],
};

export default config;
`,
  "lint-staged.config.mjs": `import { relative } from "node:path";

/**
 * Builds an ESLint command with the given filenames.
 *
 * @param {string[]} filenames - An array of filenames to be passed to the
 *   ESLint command.
 * @returns {string} - The generated ESLint command.
 */
function buildEslintCommand(filenames) {
  return \`next lint --fix --max-warnings 0 --file \${filenames.map((file) => relative(import.meta.dirname, file)).
    join(" --file ")}\`;
}

/**
 * @see https://www.npmjs.com/package/lint-staged
 * @type {import('lint-staged').Configuration}
 */
const config = {
  "*.{js,mjs,jsx,ts,tsx}": [buildEslintCommand, "prettier --list-different --write"],
  "*.{json,css,md,mdx}": ["prettier --list-different --write"],
};

export default config;
`,
  "eslint.config.mjs": `import { config } from "@codefast/eslint-config/next";
/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [...config];

export default eslintConfig;
`,
  "src/lib/fonts.ts": `import { cn } from "@codefast/ui";
import { Geist, Geist_Mono as GeistMono } from "next/font/google";

const fontGeistSans = Geist({
  subsets: ["latin"],
  variable: "--font-geist-sans",
});

const fontGeistMono = GeistMono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
});

export const fontVariables = cn(fontGeistSans.variable, fontGeistMono.variable);
`,
  "src/app/globals.css": `@import "tailwindcss";

@import "@codefast/ui/styles.css";

@source '../../node_modules/@codefast/ui';

@custom-variant dark (&:where(.dark, .dark *));

@theme inline {
  --font-sans: var(--font-geist-sans);
  --font-mono: var(--font-geist-mono);
}

@layer base {
  :root {
    --input: var(--color-neutral-200);
    --border: var(--color-neutral-200);

    --ring: var(--color-neutral-400);

    --background: var(--color-white);
    --foreground: var(--color-neutral-950);

    --primary: var(--color-sky-500);
    --primary-foreground: var(--color-neutral-50);

    --secondary: var(--color-neutral-100);
    --secondary-foreground: var(--color-neutral-900);

    --destructive: var(--color-red-600);

    --accent: var(--color-neutral-100);
    --accent-foreground: var(--color-neutral-900);

    --muted: var(--color-neutral-100);
    --muted-foreground: var(--color-neutral-500);

    --popover: var(--color-white);
    --popover-foreground: var(--color-neutral-950);
    --popover-overlay: --alpha(var(--color-neutral-900) / 20%);

    --card: var(--color-white);
    --card-foreground: var(--color-neutral-950);

    --sidebar: var(--color-neutral-50);
    --sidebar-foreground: var(--color-neutral-950);

    --sidebar-primary: var(--color-sky-500);
    --sidebar-primary-foreground: var(--color-neutral-50);

    --sidebar-accent: var(--color-neutral-100);
    --sidebar-accent-foreground: var(--color-neutral-900);

    --sidebar-border: var(--color-neutral-200);
    --sidebar-ring: var(--color-neutral-400);

    --chart-1: var(--color-orange-600);
    --chart-2: var(--color-teal-600);
    --chart-3: var(--color-cyan-600);
    --chart-4: var(--color-amber-600);
    --chart-5: var(--color-amber-500);
  }

  @variant dark {
    --input: var(--color-neutral-700);
    --border: --alpha(var(--color-neutral-700) / 50%);

    --ring: var(--color-neutral-500);

    --background: var(--color-neutral-950);
    --foreground: var(--color-neutral-50);

    --primary: var(--color-sky-700);
    --primary-foreground: var(--color-neutral-50);

    --secondary: var(--color-neutral-800);
    --secondary-foreground: var(--color-neutral-50);

    --destructive: var(--color-red-400);

    --accent: var(--color-neutral-700);
    --accent-foreground: var(--color-neutral-50);

    --muted: var(--color-neutral-800);
    --muted-foreground: var(--color-neutral-400);

    --popover: var(--color-neutral-800);
    --popover-foreground: var(--color-neutral-50);
    --popover-overlay: --alpha(var(--color-neutral-900) / 80%);

    --card: var(--color-neutral-900);
    --card-foreground: var(--color-neutral-50);

    --sidebar: var(--color-neutral-900);
    --sidebar-foreground: var(--color-neutral-50);

    --sidebar-primary: var(--color-sky-700);
    --sidebar-primary-foreground: var(--color-neutral-50);

    --sidebar-accent: var(--color-neutral-800);
    --sidebar-accent-foreground: var(--color-neutral-50);

    --sidebar-border: var(--color-neutral-800);
    --sidebar-ring: var(--color-neutral-600);

    --chart-1: var(--color-blue-700);
    --chart-2: var(--color-emerald-500);
    --chart-3: var(--color-amber-500);
    --chart-4: var(--color-purple-500);
    --chart-5: var(--color-rose-500);
  }
}
`,
};

/**
 * Updates the scripts and hooks in the package.json file of the specified project directory.
 * Adds formatting, linting, pre-commit, and commit-msg hooks to the package.json configuration.
 *
 * @param projectDir - The path to the project directory containing the package.json file
 * @returns void
 */
function updatePackageJson(projectDir: string): void {
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
  console.log("📝 Updated package.json");
}

/**
 * Creates a new Next.js project with predefined configuration flags.
 *
 * @param projectName - The name of the project to be created.
 * @returns void
 */
function createNextProject(projectName: string): void {
  console.log("📦 Creating Next.js project...");
  const flags = [
    "--ts",
    "--tailwind",
    "--eslint",
    "--app",
    "--turbo",
    "--use-pnpm",
    "--src-dir",
    "--turbopack",
    '--import-alias "@/*"',
  ].join(" ");

  runCommand(`npx create-next-app@latest ${projectName} ${flags}`);
}

/**
 * Installs project dependencies and development tools required for the application.
 *
 * This function handles the installation of both runtime and development dependencies
 * using the package manager. It ensures the necessary libraries and tools are added to the project
 * for proper operation and coding standards enforcement.
 *
 * @returns void - Does not return a value.
 */
function installDependencies(): void {
  console.log("📚 Installing dependencies...");

  // Install main dependencies
  if (MAIN_DEPENDENCIES.length > 0) {
    runCommand(`pnpm add ${MAIN_DEPENDENCIES.join(" ")}`);
  }

  // Install development dependencies
  const allDevDependencies = Object.values(DEV_DEPENDENCIES).flat().join(" ");

  if (allDevDependencies) {
    runCommand(`pnpm add -D ${allDevDependencies}`);
  }
}

/**
 * Creates configuration files in the specified project directory.
 *
 * @param projectDir - The absolute path to the project directory where the configuration files will be created
 *
 * @returns Nothing.
 */
function createConfigFiles(projectDir: string): void {
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

/**
 * Sets up the "create-project" command in the provided CLI program. This command allows users
 * to create a new Next.js project with a recommended configuration.
 *
 * The "create-project" command includes features such as scaffolding a Next.js project, applying
 * TypeScript, TailwindCSS, ESLint, Prettier, Git hooks, and other tools, ensuring a streamlined
 * development experience.
 *
 * @param program - The CLI program instance in which the command will be registered.
 */
export function createProjectCommand(program: Command): void {
  program
    .command("create-project [name]")
    .description("Create a new Next.js project with recommended setup")
    .action(async (projectNameArg) => {
      try {
        // Environment check
        checkEnvironment();

        // Get a valid project name
        const projectName = await getValidProjectName(projectNameArg);

        console.log(`\n🚀 Starting project creation for ${projectName}...\n`);

        // Create a Next.js project
        createNextProject(projectName);

        // Navigate to the project folder
        process.chdir(projectName);
        console.log(`📂 Moved to ${projectName}`);

        // Edit the postcss.config.mjs file
        updatePostcssConfig(process.cwd());

        // Install dependencies
        installDependencies();

        // Create configuration files
        createConfigFiles(process.cwd());

        // Update package.json
        updatePackageJson(process.cwd());

        // Enable git hooks
        console.log(`\n🔄 Activating git hooks...`);
        runCommand("pnpm simple-git-hooks");

        // Run Prettier to format the file
        console.log(`\n📝 Formatting files with Prettier...`);
        runCommand("pnpm format");

        // Completion notice
        console.log(`\n✅ Project created successfully!`);
        console.log(`- Project: ${projectName}`);
        console.log("- Next.js with TypeScript");
        console.log("- TailwindCSS and @codefast/ui");
        console.log("- ESLint, Prettier, Commitlint, and Git Hooks");
        console.log("- Lint-staged for pre-commit checks");
        console.log(`\n📁 Project directory: ${path.resolve(process.cwd())}`);
        console.log(`\n🚀 To start development:`);
        console.log(`cd ${projectName} && pnpm dev`);

        rl.close();
      } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";

        console.error(`\n❌ An error occurred: ${errorMessage}`);
        rl.close();
        process.exit(1);
      }
    });
}
