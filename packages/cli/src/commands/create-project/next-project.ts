import { runCommand } from "@/commands/create-project/utils";

/**
 * Creates a new Next.js project with predefined configuration flags.
 *
 * @param projectName - The name of the project to be created.
 * @returns void
 */
export function createNextProject(projectName: string): void {
  console.log(`📦 Creating Next.js project...`);
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
