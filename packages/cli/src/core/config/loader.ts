import path from "node:path";

import { createJiti } from "jiti";

import { codefastConfigRootSchema } from "#core/config/schema";
import type { CodefastConfig } from "#core/config/schema";
import { AppError, messageFrom } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";
import { parseWithSchema } from "#core/schema-parse";

/**
 * The config file names the project root may hold; at most one of them.
 */
const configFileNames = [
  "codefast.config.ts",
  "codefast.config.mts",
  "codefast.config.js",
  "codefast.config.mjs",
  "codefast.config.cjs",
  "codefast.config.json",
] as const;

async function readConfigModule(configPath: string, fs: Filesystem): Promise<unknown> {
  if (path.extname(configPath) === ".json") {
    return JSON.parse(await fs.readFile(configPath, "utf8")) as unknown;
  }
  return createJiti(configPath, { moduleCache: false }).import(configPath, { default: true });
}

/**
 * Loads and validates the project root's `codefast.config.*`, or an empty config when there is none.
 *
 * @remarks Two config files at the root are refused rather than ranked, so the one that applies is never a guess.
 */
export async function loadConfig(rootDir: string, fs: Filesystem): Promise<Result<CodefastConfig, AppError>> {
  const present = configFileNames.filter((fileName) => fs.existsSync(path.join(rootDir, fileName)));
  const [fileName] = present;
  if (fileName === undefined) {
    return ok({});
  }
  if (present.length > 1) {
    return err(new AppError("VALIDATION_ERROR", `Several config files at the project root: ${present.join(", ")}`));
  }

  let raw: unknown;
  try {
    raw = await readConfigModule(path.join(rootDir, fileName), fs);
  } catch (caughtError: unknown) {
    return err(new AppError("INFRA_FAILURE", `${fileName}: ${messageFrom(caughtError)}`, caughtError));
  }
  const parsed = parseWithSchema(codefastConfigRootSchema, raw);
  return parsed.ok ? parsed : err(new AppError("VALIDATION_ERROR", `${fileName}: ${parsed.error.message}`));
}
