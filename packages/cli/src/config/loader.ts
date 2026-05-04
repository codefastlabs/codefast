import path from "node:path";
import jiti from "jiti";
import type { ZodError } from "zod";
import type { FilesystemPort } from "#/core/filesystem";
import { codefastConfigRootSchema, type CodefastConfig } from "#/config/schema";

export type LoadConfigPayload = {
  readonly config: CodefastConfig;
  readonly warnings: string[];
  readonly configPath?: string;
};

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
  const parsed = codefastConfigRootSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error(formatZodError(parsed.error, filePath));
  }
  return parsed.data;
}

const configJsPriority = [
  "codefast.config.mjs",
  "codefast.config.js",
  "codefast.config.cjs",
] as const;
const configJson = "codefast.config.json";

const cachedLoads = new Map<string, Promise<LoadConfigPayload>>();

function listConfigCandidates(startDir: string, fs: FilesystemPort): string[] {
  const candidates: string[] = [];
  let current = path.resolve(startDir);
  while (true) {
    for (const name of configJsPriority) {
      const candidate = path.join(current, name);
      if (fs.existsSync(candidate)) {
        candidates.push(candidate);
      }
    }

    const jsonCandidate = path.join(current, configJson);
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
  jitiBaseDir: string,
  fs: FilesystemPort,
): Promise<CodefastConfig> {
  const ext = path.extname(filePath);
  if (ext === ".json") {
    const content = await fs.readFile(filePath, "utf8");
    return parseLoadedConfig(JSON.parse(content) as unknown, filePath);
  }

  const loadWithJiti = jiti(jitiBaseDir, {
    interopDefault: true,
    moduleCache: false,
  });
  const moduleConfig = loadWithJiti(filePath) as unknown;
  const unwrappedConfig =
    typeof moduleConfig === "object" && moduleConfig !== null && "default" in moduleConfig
      ? (moduleConfig as { default: unknown }).default
      : moduleConfig;
  return parseLoadedConfig(unwrappedConfig, filePath);
}

async function loadOnce(startDir: string, fs: FilesystemPort): Promise<LoadConfigPayload> {
  const warnings: string[] = [];
  const configPaths = listConfigCandidates(startDir, fs);
  if (configPaths.length === 0) {
    return { config: {}, warnings };
  }

  const configPath = configPaths[0];
  if (configPath === undefined) {
    return { config: {}, warnings };
  }
  const config = await readConfigFromPath(configPath, startDir, fs);
  return { config, warnings, configPath };
}

export function loadConfigPayload(
  startDir: string,
  fs: FilesystemPort,
): Promise<LoadConfigPayload> {
  const cacheKey = path.resolve(startDir);
  if (!cachedLoads.has(cacheKey)) {
    cachedLoads.set(cacheKey, loadOnce(cacheKey, fs));
  }
  const cached = cachedLoads.get(cacheKey);
  if (cached === undefined) {
    throw new Error("config loader cache invariant violated");
  }
  return cached;
}
