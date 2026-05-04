import process from "node:process";

/**
 * @since 0.3.16-canary.0
 */
export const logger = {
  out(line: string): void {
    process.stdout.write(`${line}\n`);
  },
  err(line: string): void {
    process.stderr.write(`${line}\n`);
  },
};
