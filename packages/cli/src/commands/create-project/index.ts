import type { Command } from "commander";

import { execSync } from "node:child_process";
import * as fs from "node:fs";
import * as path from "node:path";
import * as readline from "node:readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const prompt = (question: string): Promise<string> => {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      resolve(answer);
    });
  });
};

export const createProjectCommand = (program: Command): void => {
  program
    .command("create-project")
    .description("Create a new Next.js project with recommended setup")
    .action(async () => {
      try {
        // Bước 1: Hỏi tên dự án
        const projectName = await prompt("Nhập tên dự án: ");

        if (!projectName) {
          console.error("Tên dự án không được để trống");
          rl.close();

          return;
        }

        console.log(`\n🚀 Bắt đầu tạo dự án ${projectName}...\n`);

        // Bước 2: Tạo dự án Next.js
        console.log("📦 Tạo dự án Next.js...");
        execSync(
          `npx create-next-app@latest ${projectName} --ts --tailwind --eslint --app --turbo --use-pnpm --src-dir --turbopack --import-alias "@/*"`,
          { stdio: "inherit" },
        );

        // Bước 3: Di chuyển vào thư mục dự án
        process.chdir(projectName);
        console.log(`\n📂 Đã di chuyển vào thư mục ${projectName}`);

        // Bước 4: Cài đặt các dependencies
        console.log("\n📚 Cài đặt các dependencies cần thiết...");
        execSync(
          "pnpm add -D @commitlint/cli @commitlint/config-conventional @commitlint/types simple-git-hooks prettier prettier-plugin-packagejson prettier-plugin-tailwindcss lint-staged @codefast/eslint-config",
          { stdio: "inherit" },
        );

        console.log("\n📚 Cài đặt @codefast/ui...");
        execSync("pnpm add @codefast/ui", { stdio: "inherit" });

        // Bước 5: Tạo các file cấu hình
        console.log("\n📝 Tạo các file cấu hình...");

        // commitlint.config.mjs
        fs.writeFileSync(
          "commitlint.config.mjs",
          `/**
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
        );

        // prettier.config.mjs
        fs.writeFileSync(
          "prettier.config.mjs",
          `/**
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
        );

        // lint-staged.config.mjs
        fs.writeFileSync(
          "lint-staged.config.mjs",
          `import { relative } from "node:path";

/**
 * Builds an ESLint command with the given filenames.
 *
 * @param {string[]} filenames - An array of filenames to be passed to the
 *   ESLint command.
 * @returns {string} - The generated ESLint command.
 */
function buildEslintCommand(filenames) {
  return \`next lint --fix --max-warnings 0 --file \${filenames
    .map((file) => relative(import.meta.dirname, file))
    .join(" --file ")}\`;
}

/**
 * @see https://www.npmjs.com/package/lint-staged
 * @type {import('lint-staged').Configuration}
 */
const config = {
  "*.{json,css,scss,md}": ["prettier --list-different --write"],
  "*.{js,mjs,jsx,ts,tsx}": [buildEslintCommand, "prettier --list-different --write"],
};

export default config;
`,
        );

        // eslint.config.mjs
        fs.writeFileSync(
          "eslint.config.mjs",
          `import { config } from "@codefast/eslint-config/next";

/**
 * @see https://eslint.org/docs/latest/use/configure/configuration-files
 * @type {import('eslint').Linter.Config[]}
 */
const eslintConfig = [...config];

export default eslintConfig;
`,
        );

        // Cập nhật package.json để thêm các scripts và cấu hình
        const packageJsonPath = path.join(process.cwd(), "package.json");
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));

        packageJson.scripts = {
          ...packageJson.scripts,
          format: 'prettier --write "**/*.{js,mjs,jsx,ts,tsx,json,css,scss,md}"',
          "format:check": 'prettier --check "**/*.{js,mjs,jsx,ts,tsx,json,css,scss,md}"',
          "lint:check": "next lint --max-warnings 0",
        };

        packageJson["simple-git-hooks"] = {
          "pre-commit": "pnpm lint-staged",
          "commit-msg": "pnpm commitlint --edit",
        };

        fs.writeFileSync(packageJsonPath, JSON.stringify(packageJson, null, 2));

        // Tạo file fonts.ts
        const libDir = path.join(process.cwd(), "src/lib");

        if (!fs.existsSync(libDir)) {
          fs.mkdirSync(libDir, { recursive: true });
        }

        fs.writeFileSync(
          path.join(libDir, "fonts.ts"),
          `import { cn } from "@codefast/ui";
import { Geist_Mono as GeistMono } from "next/dist/compiled/@next/font/dist/google";
import { Geist } from "next/font/google";

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
        );

        // Cập nhật file globals.css
        const globalsCssPath = path.join(process.cwd(), "src/app/globals.css");

        fs.writeFileSync(
          globalsCssPath,
          `@import "tailwindcss";

@import "@codefast/ui/styles.css";

@source '../../node_modules/@codefast/ui/dist';

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
        );

        // Kích hoạt git hooks
        console.log("\n🔄 Kích hoạt git hooks...");
        execSync("pnpm install", { stdio: "inherit" });

        console.log("\n✅ Hoàn tất! Dự án đã được tạo thành công với cấu hình đầy đủ:");
        console.log(`- Tên dự án: ${projectName}`);
        console.log("- Next.js với TypeScript");
        console.log("- TailwindCSS và @codefast/ui");
        console.log("- ESLint và Prettier");
        console.log("- Commitlint và Git Hooks");
        console.log("- Lint-staged để kiểm tra code trước khi commit");
        console.log(`\n📁 Thư mục dự án: ${path.resolve(process.cwd())}`);
        console.log("\n🚀 Để bắt đầu phát triển:");
        console.log(`cd ${projectName} && pnpm dev`);

        rl.close();
      } catch (error) {
        console.error("❌ Đã xảy ra lỗi:", error);
        rl.close();
        process.exit(1);
      }
    });
};
