import type { Server } from "node:http";
import { createHash } from "node:crypto";
import { readFileSync, watch } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Hono } from "hono";
import { stream } from "hono/streaming";
import { createAdaptorServer } from "@hono/node-server";
import { buildEmbeddedPayload, listRawRuns } from "#/server/payload";
import { renderDocument } from "#/server/render";
import { DEFAULT_MAX_RUNS } from "#/constants";
import type { BenchServerOptions, EmbeddedViewerPayload } from "#/types";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app");

const IMMUTABLE = "public, max-age=31536000, immutable";
const NO_CACHE = "no-cache";
const NO_STORE = "no-store";

const CONTENT_TYPES: Record<string, string> = {
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".svg": "image/svg+xml",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".ttf": "font/ttf",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".ico": "image/x-icon",
};

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
  assetCache: Map<string, CachedAsset>;
  options: BenchServerOptions;
  payloadCache: PayloadCache | null;
}

function computeEtag(hashInput: Buffer | string): string {
  return `"${createHash("sha1").update(hashInput).digest("hex").slice(0, 16)}"`;
}

function asArrayBuffer(nodeBuffer: Buffer): ArrayBuffer {
  return nodeBuffer.buffer.slice(
    nodeBuffer.byteOffset,
    nodeBuffer.byteOffset + nodeBuffer.byteLength,
  ) as ArrayBuffer;
}

function loadAsset(filePath: string, cacheControl: string): CachedAsset {
  const fileBytes = readFileSync(filePath);
  const contentType = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
  return { content: fileBytes, contentType, cacheControl, etag: computeEtag(fileBytes) };
}

function resolveStaticFile(pathname: string): string | null {
  const filePath = resolve(appDir, pathname.slice(1));
  return filePath.startsWith(appDir + "/") ? filePath : null;
}

function parseLimitParam(limitParam: string | null, defaultLimit: number): number {
  if (limitParam === null) {
    return defaultLimit;
  }
  const parsedLimit = parseInt(limitParam, 10);
  return Number.isFinite(parsedLimit) && parsedLimit > 0
    ? Math.min(parsedLimit, 10_000)
    : defaultLimit;
}

async function getOrBuildCache(state: ServerState, runLimit: number): Promise<PayloadCache> {
  if (state.payloadCache !== null && state.payloadCache.limit === runLimit) {
    return state.payloadCache;
  }
  const {
    runs: rawRuns,
    hasMore,
    warning,
  } = await listRawRuns(state.options.benchResultsDir, runLimit);
  const payload = buildEmbeddedPayload(rawRuns, state.options, hasMore, runLimit, warning);
  const rawJson = JSON.stringify(payload);
  const payloadEntry: PayloadCache = {
    payload,
    rawJson,
    etag: computeEtag(rawJson),
    limit: runLimit,
  };
  state.payloadCache = payloadEntry;
  return payloadEntry;
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
  const state: ServerState = { assetCache: new Map(), options, payloadCache: null };
  const app = new Hono();

  app.onError((err, c) => {
    console.error("[bench-server] unhandled error:", err);
    return c.text(String(err), 500);
  });

  app.get("/", async (c) => {
    const runLimit = state.options.maxRuns ?? DEFAULT_MAX_RUNS;
    const cachedPayload = await getOrBuildCache(state, runLimit);
    if (c.req.header("if-none-match") === cachedPayload.etag) {
      return c.body(null, 304);
    }
    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", NO_CACHE);
    c.header("ETag", cachedPayload.etag);
    return stream(c, async (responseStream) => {
      const htmlStream = await renderDocument(cachedPayload.payload, cachedPayload.rawJson);
      await responseStream.pipe(htmlStream);
    });
  });

  app.get("/api/payload", async (c) => {
    const defaultRunLimit = state.options.maxRuns ?? DEFAULT_MAX_RUNS;
    const runLimit = parseLimitParam(c.req.query("limit") ?? null, defaultRunLimit);
    const cachedPayload = await getOrBuildCache(state, runLimit);
    c.header("Content-Type", "application/json; charset=utf-8");
    c.header("Cache-Control", NO_STORE);
    return c.body(cachedPayload.rawJson);
  });

  app.get("/*", (c) => {
    const filePath = resolveStaticFile(c.req.path);
    if (filePath === null) {
      return c.text("Forbidden", 403);
    }

    let staticAsset = state.assetCache.get(c.req.path);
    if (staticAsset === undefined) {
      try {
        staticAsset = loadAsset(filePath, IMMUTABLE);
        state.assetCache.set(c.req.path, staticAsset);
      } catch {
        return c.text("Not found", 404);
      }
    }

    if (c.req.header("if-none-match") === staticAsset.etag) {
      return c.body(null, 304);
    }
    c.header("Content-Type", staticAsset.contentType);
    c.header("Cache-Control", staticAsset.cacheControl);
    c.header("ETag", staticAsset.etag);
    return c.body(asArrayBuffer(staticAsset.content));
  });

  const server = createAdaptorServer(app) as Server;

  try {
    const watcher = watch(options.benchResultsDir, { persistent: false }, () => {
      state.payloadCache = null;
    });
    server.once("close", () => watcher.close());
  } catch {
    // directory isn't found — watcher unavailable, cache cleared on each miss anyway
  }

  return server;
}
