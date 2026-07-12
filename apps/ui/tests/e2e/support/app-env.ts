import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

/** `apps/ui` — same root `globalSetup` uses for `pnpm dev` (Vite loads `.env*` here). */
export const APP_ROOT = fileURLToPath(new URL("../../..", import.meta.url));

const GA_ENV_KEY = "VITE_GA4_MEASUREMENT_ID";

/**
 * Parses `KEY=value` lines from a Vite-style env file. Does not log values.
 * Skips blank lines and `#` comments; strips optional surrounding quotes.
 */
function parseEnvFile(contents: string): Record<string, string> {
  const result: Record<string, string> = {};

  for (const line of contents.split(/\r?\n/u)) {
    const trimmed = line.trim();

    if (trimmed.length === 0 || trimmed.startsWith("#")) {
      continue;
    }

    const eq = trimmed.indexOf("=");

    if (eq <= 0) {
      continue;
    }

    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();

    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }

    result[key] = value;
  }

  return result;
}

function readEnvLocal(): Record<string, string> {
  const path = join(APP_ROOT, ".env.local");

  if (!existsSync(path)) {
    return {};
  }

  return parseEnvFile(readFileSync(path, "utf8"));
}

/**
 * Whether a non-empty GA4 measurement id is available to the app under test.
 * Checks `process.env` first, then `apps/ui/.env.local` (gitignored; present locally).
 * Never returns or logs the id itself.
 */
export function isGaMeasurementIdConfigured(): boolean {
  const fromProcess = process.env[GA_ENV_KEY]?.trim();

  if (fromProcess) {
    return true;
  }

  const fromFile = readEnvLocal()[GA_ENV_KEY]?.trim();
  return Boolean(fromFile);
}

/**
 * Env for a spawned `pnpm dev`: merge `.env.local` under keys not already set so Vite
 * (and any child that only reads `process.env`) sees the same values as a normal local run.
 */
export function envForSpawnedDevServer(): NodeJS.ProcessEnv {
  const fromFile = readEnvLocal();
  const merged: NodeJS.ProcessEnv = { ...process.env };

  for (const [key, value] of Object.entries(fromFile)) {
    if (merged[key] === undefined) {
      merged[key] = value;
    }
  }

  return merged;
}
