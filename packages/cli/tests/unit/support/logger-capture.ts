import { vi } from "vitest";

import { logger } from "#core/logger";

/**
 * Captures what the CLI prints through `logger`, each stream joined into one string.
 */
export function captureLogger(): { readonly out: () => string; readonly err: () => string } {
  const out = vi.spyOn(logger, "out").mockImplementation(() => {});
  const err = vi.spyOn(logger, "err").mockImplementation(() => {});
  return {
    out: () => out.mock.calls.map(([line]) => line).join("\n"),
    err: () => err.mock.calls.map(([line]) => line).join("\n"),
  };
}
