import { execSync } from "node:child_process";

/**
 * Checks the current environment to ensure PNPM is installed.
 * If PNPM is not detected, logs an error message and terminates the process.
 *
 * @returns void
 */
export function checkEnvironment(): void {
  try {
    execSync("pnpm --version", { stdio: "ignore" });
  } catch {
    console.error(`❌ PNPM chưa được cài đặt. Vui lòng cài đặt PNPM trước.`);
    process.exit(1);
  }
}
