import type { CliLogger } from "#lib/infra/fs-contract";

const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

/** User-visible lines for non-fatal issues returned with a successfully parsed config. */
export function printConfigSchemaWarnings(logger: CliLogger, warnings: string[]): void {
  const { out } = logger;
  for (const warningMessage of warnings) {
    out(`${YELLOW}\u26A0\uFE0F ${warningMessage}${RESET}`);
  }
}
