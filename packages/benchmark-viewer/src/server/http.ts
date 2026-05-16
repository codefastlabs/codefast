import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFileSync, watch } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEmbeddedPayload, DEFAULT_MAX_RUNS, listRawRuns } from "#/server/payload";
import { renderDocument } from "#/server/render";
import type { BenchServerOptions, EmbeddedViewerPayload } from "#/types";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app");

const IMMUTABLE = "public, max-age=31536000, immutable";
const NO_CACHE = "no-cache";
const NO_STORE = "no-store";

interface CachedAsset {
  content: Buffer;
  contentType: string;
  cacheControl: string;
  etag: string;
}

interface PayloadCache {
  payload: EmbeddedViewerPayload;
  rawJson: string;
  etag: string;
  limit: number;
}

interface ServerState {
  entryJs: CachedAsset;
  stylesCss: CachedAsset;
  chunksDir: string;
  chunkCache: Map<string, CachedAsset>;
  options: BenchServerOptions;
  payloadCache: PayloadCache | null;
}

function computeEtag(content: Buffer | string): string {
  return `"${createHash("sha1").update(content).digest("hex").slice(0, 16)}"`;
}

function loadAsset(filePath: string, contentType: string, cacheControl: string): CachedAsset {
  const content = readFileSync(filePath);
  return { content, contentType, cacheControl, etag: computeEtag(content) };
}

function serveAsset(asset: CachedAsset, req: IncomingMessage, res: ServerResponse): void {
  if (req.headers["if-none-match"] === asset.etag) {
    res.writeHead(304);
    res.end();
    return;
  }
  res.writeHead(200, {
    "Content-Type": asset.contentType,
    "Cache-Control": asset.cacheControl,
    ETag: asset.etag,
  });
  res.end(asset.content);
}

function initState(options: BenchServerOptions): ServerState {
  return {
    entryJs: loadAsset(join(appDir, "entry.js"), "application/javascript; charset=utf-8", NO_CACHE),
    stylesCss: loadAsset(join(appDir, "styles.css"), "text/css; charset=utf-8", NO_CACHE),
    chunksDir: resolve(appDir, "chunks"),
    chunkCache: new Map(),
    options,
    payloadCache: null,
  };
}

function parseLimitParam(raw: string | null, defaultLimit: number): number {
  if (raw === null) {
    return defaultLimit;
  }
  const parsed = parseInt(raw, 10);
  return Number.isFinite(parsed) && parsed > 0 ? Math.min(parsed, 10_000) : defaultLimit;
}

async function getOrBuildCache(state: ServerState, limit: number): Promise<PayloadCache> {
  if (state.payloadCache !== null && state.payloadCache.limit === limit) {
    return state.payloadCache;
  }
  const {
    runs: rawRuns,
    hasMore,
    warning,
  } = await listRawRuns(state.options.benchResultsDir, limit);
  const payload = buildEmbeddedPayload(rawRuns, state.options, hasMore, limit, warning);
  const rawJson = JSON.stringify(payload);
  const etag = computeEtag(rawJson);
  const cache: PayloadCache = { payload, rawJson, etag, limit };
  state.payloadCache = cache;
  return cache;
}

function handleChunk(
  state: ServerState,
  req: IncomingMessage,
  res: ServerResponse,
  name: string,
): void {
  const chunkPath = resolve(state.chunksDir, name);
  if (!chunkPath.startsWith(state.chunksDir + "/")) {
    res.writeHead(400);
    res.end("Bad request");
    return;
  }
  let chunk = state.chunkCache.get(name);
  if (!chunk) {
    chunk = loadAsset(chunkPath, "application/javascript; charset=utf-8", IMMUTABLE);
    state.chunkCache.set(name, chunk);
  }
  serveAsset(chunk, req, res);
}

async function handleRoot(
  state: ServerState,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const limit = state.options.maxRuns ?? DEFAULT_MAX_RUNS;
    const cache = await getOrBuildCache(state, limit);
    if (req.headers["if-none-match"] === cache.etag) {
      res.writeHead(304);
      res.end();
      return;
    }
    res.setHeader("Cache-Control", NO_CACHE);
    res.setHeader("ETag", cache.etag);
    renderDocument(req, res, cache.payload, cache.rawJson);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(String(err));
  }
}

async function handleApiPayload(
  state: ServerState,
  req: IncomingMessage,
  res: ServerResponse,
): Promise<void> {
  try {
    const url = new URL(req.url ?? "/", "http://localhost");
    const defaultLimit = state.options.maxRuns ?? DEFAULT_MAX_RUNS;
    const limit = parseLimitParam(url.searchParams.get("limit"), defaultLimit);
    const cache = await getOrBuildCache(state, limit);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": NO_STORE,
    });
    res.end(cache.rawJson);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
}

function createRequestHandler(state: ServerState) {
  return (req: IncomingMessage, res: ServerResponse): void => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
      handleRoot(state, req, res).catch((err: unknown) => {
        console.error("[bench-server] handleRoot error:", err);
      });
      return;
    }
    if (url.pathname === "/entry.js") {
      return serveAsset(state.entryJs, req, res);
    }
    if (url.pathname === "/styles.css") {
      return serveAsset(state.stylesCss, req, res);
    }

    const chunkMatch = /^\/chunks\/([^/]+\.js)$/.exec(url.pathname);
    if (chunkMatch) {
      return handleChunk(state, req, res, chunkMatch[1]!);
    }

    if (url.pathname === "/api/payload") {
      handleApiPayload(state, req, res).catch((err: unknown) => {
        console.error("[bench-server] handleApiPayload error:", err);
      });
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  };
}

/**
 * Creates an HTTP server for the benchmark history viewer.
 *
 * Bind to loopback (`127.0.0.1`) unless you intend to expose benchmark results on the network:
 * routes stream JSON and HTML derived from {@link BenchServerOptions.benchResultsDir}.
 *
 * @since 0.3.16-canary.0
 */
export function createBenchServer(options: BenchServerOptions): Server {
  const state = initState(options);
  const server = createServer(createRequestHandler(state));

  // Invalidate the payload cache whenever a new run directory is added.
  // If benchResultsDir doesn't exist yet, skip the watcher — listRawRuns will
  // return an empty result with a warning on each request until it appears.
  try {
    const watcher = watch(options.benchResultsDir, { persistent: false }, () => {
      state.payloadCache = null;
    });
    server.once("close", () => watcher.close());
  } catch {
    // directory not found — watcher unavailable, cache cleared on each miss anyway
  }

  return server;
}
