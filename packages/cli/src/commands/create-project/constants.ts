/**
 * Main dependencies need to be installed
 */
export const MAIN_DEPENDENCIES = ["@codefast/ui", "@codefast/hooks"];

/**
 * Development dependencies are grouped by function.
 */
export const DEV_DEPENDENCIES = {
  commitLint: ["@commitlint/cli", "@commitlint/config-conventional", "@commitlint/types"],
  gitTools: ["simple-git-hooks"],
  formatting: ["prettier", "prettier-plugin-packagejson", "prettier-plugin-tailwindcss", "lint-staged"],
  linting: ["@codefast/eslint-config"],
};

/**
 * Packages that need to be removed from the project
 */
export const PACKAGES_TO_REMOVE = ["@eslint/eslintrc"];

/**
 * Define a schema for a configuration file
 */
export interface ConfigFile {
  /** Configuration file content */
  content: string;
  /** Path to the configuration file */
  path: string;
  /** Description of file purpose options */
  description?: string;
}

/**
 * Define configuration categories
 */
export type ConfigCategory = "deployment" | "formatting" | "linting" | "styles";

/**
 * Type for the configuration groups
 */
export type ConfigGroups = Record<ConfigCategory, ConfigFile[]>;

/**
 * Group configurations by tool type
 */
export const configGroups: ConfigGroups = {
  deployment: [
    {
      path: ".vercelignore",
      content: `#-------------------------------------------------------------------------------
# Dependencies and package managers
#-------------------------------------------------------------------------------

# Node dependencies
node_modules
.pnpm-store
.yarn

#-------------------------------------------------------------------------------
# Development and environment
#-------------------------------------------------------------------------------

# Environment variables (except examples)
.env*
!.env.example

# Build artifacts
.next
build
dist
.git
.github
.turbo
.changeset
.eslintcache

# Debug logs
npm-debug.log*
yarn-debug.log*

#-------------------------------------------------------------------------------
# Testing
#-------------------------------------------------------------------------------

# Test coverage reports and config snapshots
coverage
*.test.*
*.e2e.*

#-------------------------------------------------------------------------------
# Editor and IDE configuration
#-------------------------------------------------------------------------------

# IDE project files
.idea
*.suo
*.ntvs*
*.njsproj
*.sln

#-------------------------------------------------------------------------------
# Operating system files
#-------------------------------------------------------------------------------

# System metadata files
.DS_Store
Thumbs.db

#-------------------------------------------------------------------------------
# Deployment
#-------------------------------------------------------------------------------

# Vercel deployment configuration
.vercel
`,
      description: "Ignore files that should not be deployed to Vercel",
    },
  ],
  formatting: [
    {
      path: "prettier.config.mjs",
      content: `/**
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
      description: "Prettier configuration for source code formatting",
    },
    {
      path: ".editorconfig",
      content: `# https://editorconfig.org
root = true

[*]
charset = utf-8
insert_final_newline = true

end_of_line = lf
indent_style = space
indent_size = 2
max_line_length = 120

trim_trailing_whitespace = true

[Makefile]
indent_style = tab

[{go.mod,go.sum,*.go}]
indent_style = tab

[*.rs]
# Keep in sync with rustfmt
indent_size = 4
`,
      description: "Editor configuration for source code formatting",
    },
  ],
  linting: [
    {
      path: "commitlint.config.mjs",
      content: `/**
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
      description: "Commitlint configuration",
    },
    {
      path: "eslint.config.mjs",
      content: `import { config } from "@codefast/eslint-config/next";
/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [...config];

export default eslintConfig;
`,
      description: "ESLint configuration for the project",
    },
    {
      path: "lint-staged.config.mjs",
      content: `import { relative } from "node:path";
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
      description: "Configure lint-staged for pre-commit checks",
    },
  ],
  styles: [
    {
      path: "src/lib/fonts.ts",
      content: `import { cn } from "@codefast/ui";
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
      description: "Font configuration for the application",
    },
    {
      path: "src/app/globals.css",
      content: `@import "tailwindcss";

@import "@codefast/ui/styles.css";

@source '../../node_modules/@codefast/ui';

@custom-variant dark (&:where(.dark, .dark *));

@layer base {
  :root {
    --font-sans: var(--font-geist-sans);
    --font-mono: var(--font-geist-mono);
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
      description: "Global CSS variables for the application",
    },
  ],
};
