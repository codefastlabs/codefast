import path from "node:path";
import jiti from "jiti";
import { ZodError } from "zod";
import type { CliFs } from "#/lib/infra/fs-contract.port";
import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";
import { codefastConfigSchema } from "#/lib/config/infra/config-schema.adapter";
import type { CodefastConfig } from "#/lib/config/domain/schema.domain";

const CONFIG_JS_PRIORITY = [
  "codefast.config.mjs",
  "codefast.config.js",
  "codefast.config.cjs",
] as const;
const CONFIG_JSON = "codefast.config.json";

type LoadConfigResult = {
  config: CodefastConfig;
  warnings: string[];
  configPath?: string;
};

const cachedLoads = new Map<string, Promise<LoadConfigResult>>();

function formatZodError(error: ZodError, filePath: string): string {
  const formatted = error.issues
    .map((issue) => {
      const pathLabel = issue.path.length > 0 ? issue.path.join(".") : "<root>";
      return `  - ${pathLabel}: ${issue.message}`;
    })
    .join("\n");

  return `Invalid config schema in ${path.basename(filePath)}:\n${formatted}`;
}

function parseLoadedConfig(raw: unknown, filePath: string): CodefastConfig {
  try {
    return codefastConfigSchema.parse(raw);
  } catch (caughtError: unknown) {
    if (caughtError instanceof ZodError) {
      throw new Error(formatZodError(caughtError, filePath));
    }
    throw caughtError;
  }
}

function listConfigCandidates(startDir: string, fs: CliFs): string[] {
  const candidates: string[] = [];
  let current = path.resolve(startDir);
  while (true) {
    for (const name of CONFIG_JS_PRIORITY) {
      const candidate = path.join(current, name);
      if (fs.existsSync(candidate)) {
        candidates.push(candidate);
      }
    }

    const jsonCandidate = path.join(current, CONFIG_JSON);
    if (fs.existsSync(jsonCandidate)) {
      candidates.push(jsonCandidate);
    }

    const parent = path.dirname(current);
    if (parent === current) {
      break;
    }
    current = parent;
  }
  return candidates;
}

async function readConfigFromPath(
  filePath: string,
  fs: CliFs,
  jitiBaseDir: string,
): Promise<CodefastConfig> {
  const ext = path.extname(filePath);
  if (ext === ".json") {
    const content = await fs.readFile(filePath, "utf8");
    return parseLoadedConfig(JSON.parse(content), filePath);
  }

  const loadWithJiti = jiti(jitiBaseDir, {
    interopDefault: true,
    moduleCache: false,
  });
  const moduleConfig = loadWithJiti(filePath);
  const unwrappedConfig =
    typeof moduleConfig === "object" && moduleConfig !== null && "default" in moduleConfig
      ? (moduleConfig as { default: unknown }).default
      : moduleConfig;
  return parseLoadedConfig(unwrappedConfig, filePath);
}

async function loadOnce(fs: CliFs, startDir: string): Promise<LoadConfigResult> {
  const warnings: string[] = [];
  const configPaths = listConfigCandidates(startDir, fs);
  if (configPaths.length === 0) {
    return { config: {}, warnings };
  }

  const configPath = configPaths[0];
  if (configPath === undefined) {
    return { config: {}, warnings };
  }
  const config = await readConfigFromPath(configPath, fs, startDir);
  return { config, warnings, configPath };
}

export async function loadConfig(fs: CliFs, startDir: string): Promise<LoadConfigResult> {
  const cacheKey = path.resolve(startDir);
  if (!cachedLoads.has(cacheKey)) {
    cachedLoads.set(cacheKey, loadOnce(fs, cacheKey));
  }
  const cached = cachedLoads.get(cacheKey);
  if (cached === undefined) {
    throw new Error("config loader cache invariant violated");
  }
  return cached;
}

export function resetConfigLoaderCacheForTests(): void {
  cachedLoads.clear();
}

export const configLoaderAdapter: ConfigLoaderPort = {
  loadConfig,
};
