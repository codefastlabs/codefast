import path from "node:path";
import process from "node:process";
import { pathToFileURL } from "node:url";
import type { CliFs } from "#lib/infra/fs-contract";
import type { MirrorConfig } from "#lib/mirror/types";
import type {
  CodefastAfterWriteHook,
  CodefastConfig,
  CodefastTagConfig,
} from "#lib/shared/config-types";

const CONFIG_JS_PRIORITY = [
  "codefast.config.mjs",
  "codefast.config.js",
  "codefast.config.cjs",
] as const;
const CONFIG_JSON = "codefast.config.json";
const LEGACY_JS = "generate-exports.config.js";
const LEGACY_JSON = "generate-exports.config.json";

export type LoadConfigResult = {
  config: CodefastConfig;
  warnings: string[];
  configPath?: string;
};

let cachedLoad: Promise<LoadConfigResult> | undefined;

function configImportUrl(filePath: string): string {
  return pathToFileURL(filePath).href;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isPathTransformations(
  value: unknown,
): value is NonNullable<MirrorConfig["pathTransformations"]> {
  if (!isPlainObject(value)) return false;
  for (const inner of Object.values(value)) {
    if (!isPlainObject(inner)) return false;
    if (
      "removePrefix" in inner &&
      inner.removePrefix !== undefined &&
      typeof inner.removePrefix !== "string"
    ) {
      return false;
    }
  }
  return true;
}

function isCustomExports(value: unknown): value is NonNullable<MirrorConfig["customExports"]> {
  if (!isPlainObject(value)) return false;
  for (const inner of Object.values(value)) {
    if (!isPlainObject(inner)) return false;
    for (const leaf of Object.values(inner)) {
      if (typeof leaf !== "string") return false;
    }
  }
  return true;
}

function isCssExports(value: unknown): value is NonNullable<MirrorConfig["cssExports"]> {
  if (!isPlainObject(value)) return false;
  for (const entry of Object.values(value)) {
    if (typeof entry === "boolean") continue;
    if (!isPlainObject(entry)) return false;
    if ("enabled" in entry && entry.enabled !== undefined && typeof entry.enabled !== "boolean") {
      return false;
    }
    if (
      "forceExportFiles" in entry &&
      entry.forceExportFiles !== undefined &&
      typeof entry.forceExportFiles !== "boolean"
    ) {
      return false;
    }
    const nested = entry.customExports;
    if (nested !== undefined) {
      if (!isPlainObject(nested)) return false;
      for (const leaf of Object.values(nested)) {
        if (typeof leaf !== "string") return false;
      }
    }
  }
  return true;
}

function extractMirrorConfig(parsedObj: Record<string, unknown>): MirrorConfig {
  const config: MirrorConfig = {};

  const skipPackages = parsedObj.skipPackages;
  if (skipPackages !== undefined && isStringArray(skipPackages)) {
    config.skipPackages = skipPackages;
  }

  const pathTransformations = parsedObj.pathTransformations;
  if (pathTransformations !== undefined && isPathTransformations(pathTransformations)) {
    config.pathTransformations = pathTransformations;
  }

  const customExports = parsedObj.customExports;
  if (customExports !== undefined && isCustomExports(customExports)) {
    config.customExports = customExports;
  }

  const cssExports = parsedObj.cssExports;
  if (cssExports !== undefined && isCssExports(cssExports)) {
    config.cssExports = cssExports;
  }

  return config;
}

function normalizeAfterWriteHook(value: unknown): CodefastAfterWriteHook | undefined {
  if (typeof value !== "function") return undefined;
  return value as CodefastAfterWriteHook;
}

function normalizeHookConfig(raw: unknown): CodefastTagConfig | undefined {
  if (!isPlainObject(raw)) return undefined;
  const onAfterWrite = normalizeAfterWriteHook(raw.onAfterWrite);
  if (!onAfterWrite) return undefined;
  return { onAfterWrite };
}

function normalizeLoadedConfig(raw: unknown): CodefastConfig {
  if (!isPlainObject(raw)) return {};
  const parsedObj = raw;
  const out: CodefastConfig = {};

  const mirrorSource =
    "mirror" in parsedObj && isPlainObject(parsedObj.mirror)
      ? (parsedObj.mirror as Record<string, unknown>)
      : parsedObj;
  out.mirror = extractMirrorConfig(mirrorSource);

  const tagCfg = normalizeHookConfig(parsedObj.tag);
  if (tagCfg) out.tag = tagCfg;

  const arrangeCfg = normalizeHookConfig(parsedObj.arrange);
  if (arrangeCfg) out.arrange = arrangeCfg;

  return out;
}

function listConfigCandidates(startDir: string, fs: CliFs): string[] {
  const candidates: string[] = [];
  let current = path.resolve(startDir);
  while (true) {
    for (const name of CONFIG_JS_PRIORITY) {
      const candidate = path.join(current, name);
      if (fs.existsSync(candidate)) candidates.push(candidate);
    }

    const jsonCandidate = path.join(current, CONFIG_JSON);
    if (fs.existsSync(jsonCandidate)) candidates.push(jsonCandidate);

    const legacyJs = path.join(current, LEGACY_JS);
    if (fs.existsSync(legacyJs)) candidates.push(legacyJs);

    const legacyJson = path.join(current, LEGACY_JSON);
    if (fs.existsSync(legacyJson)) candidates.push(legacyJson);

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  return candidates;
}

async function readConfigFromPath(filePath: string, fs: CliFs): Promise<CodefastConfig> {
  const ext = path.extname(filePath);
  if (ext === ".json") {
    const content = await fs.readFile(filePath, "utf8");
    return normalizeLoadedConfig(JSON.parse(content));
  }

  const mod = await import(configImportUrl(filePath));
  return normalizeLoadedConfig(mod.default ?? mod);
}

async function loadOnce(fs: CliFs): Promise<LoadConfigResult> {
  const warnings: string[] = [];
  const configPaths = listConfigCandidates(process.cwd(), fs);
  if (configPaths.length === 0) return { config: {}, warnings };

  for (const configPath of configPaths) {
    try {
      const config = await readConfigFromPath(configPath, fs);
      return { config, warnings, configPath };
    } catch (error) {
      warnings.push(`Could not load ${path.basename(configPath)}: ${String(error)}`);
    }
  }

  return { config: {}, warnings, configPath: configPaths[0] };
}

export async function loadConfig(fs: CliFs): Promise<LoadConfigResult> {
  if (!cachedLoad) {
    cachedLoad = loadOnce(fs);
  }
  return cachedLoad;
}

export function resetConfigLoaderCacheForTests(): void {
  cachedLoad = undefined;
}
