import { createHash } from "node:crypto";
import { existsSync, readFileSync, watch } from "node:fs";
import type { Server } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import { stream } from "hono/streaming";

import { DEFAULT_MAX_RUNS } from "#/constants";
import { buildEmbeddedPayload, listRawRuns } from "#/server/payload";
import { renderDocument } from "#/server/render";
import type { BenchServerOptions, EmbeddedViewerPayload } from "#/types";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app");
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

const HTTP_IMMUTABLE = "public, max-age=31536000, immutable";
const HTTP_NO_CACHE = "no-cache";
const HTTP_NO_STORE = "no-store";

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

interface InMemoryAsset {
  content: Buffer;
  contentType: string;
  httpCacheControl: string;
  etag: string;
}

interface InMemoryPayload {
  payload: EmbeddedViewerPayload;
  rawJson: string;
  etag: string;
  limit: number;
}

interface ServerState {
  assetMemoryCache: Map<string, InMemoryAsset>;
  options: BenchServerOptions;
  payloadMemoryCache: InMemoryPayload | null;
}

function computeEtag(hashInput: Buffer | string): string {
  return `"${createHash("sha1").update(hashInput).digest("hex").slice(0, 16)}"`;
}

function asArrayBuffer(nodeBuffer: Buffer): ArrayBuffer {
  return nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength) as ArrayBuffer;
}

function loadAsset(filePath: string, httpCacheControl: string): InMemoryAsset {
  const fileBytes = readFileSync(filePath);
  const contentType = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
  return { content: fileBytes, contentType, httpCacheControl, etag: computeEtag(fileBytes) };
}

function resolveStaticFile(pathname: string): { filePath: string; httpCacheControl: string } | null {
  const stripped = pathname.slice(1);

  const appPath = resolve(appDir, stripped);
  if (appPath.startsWith(appDir + "/") && existsSync(appPath)) {
    return { filePath: appPath, httpCacheControl: HTTP_IMMUTABLE };
  }

  const publicPath = resolve(publicDir, stripped);
  if (publicPath.startsWith(publicDir + "/")) {
    return { filePath: publicPath, httpCacheControl: HTTP_IMMUTABLE };
  }

  return null;
}

function parseLimitParam(limitParam: string | null, defaultLimit: number): number {
  if (limitParam === null) {
    return defaultLimit;
  }
  const parsedLimit = parseInt(limitParam, 10);
  return Number.isFinite(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 10_000) : defaultLimit;
}

async function getOrBuildPayload(state: ServerState, runLimit: number): Promise<InMemoryPayload> {
  if (state.payloadMemoryCache !== null && state.payloadMemoryCache.limit === runLimit) {
    return state.payloadMemoryCache;
  }
  const { runs: rawRuns, hasMore, warning } = await listRawRuns(state.options.benchResultsDir, runLimit);
  const payload = buildEmbeddedPayload(rawRuns, state.options, hasMore, runLimit, warning);
  const rawJson = JSON.stringify(payload);
  const payloadEntry: InMemoryPayload = {
    payload,
    rawJson,
    etag: computeEtag(rawJson),
    limit: runLimit,
  };
  state.payloadMemoryCache = payloadEntry;
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
  const state: ServerState = { assetMemoryCache: new Map(), options, payloadMemoryCache: null };
  const app = new Hono();

  app.onError((err, c) => {
    console.error("[bench-server] unhandled error:", err);
    return c.text(String(err), 500);
  });

  app.get("/", async (c) => {
    const runLimit = state.options.maxRuns ?? DEFAULT_MAX_RUNS;
    const cachedPayload = await getOrBuildPayload(state, runLimit);
    if (c.req.header("if-none-match") === cachedPayload.etag) {
      return c.body(null, 304);
    }
    c.header("Content-Type", "text/html; charset=utf-8");
    c.header("Cache-Control", HTTP_NO_CACHE);
    c.header("ETag", cachedPayload.etag);
    return stream(c, async (responseStream) => {
      const htmlStream = await renderDocument(cachedPayload.payload, cachedPayload.rawJson, c.req.raw.signal);
      await responseStream.pipe(htmlStream);
    });
  });

  app.get("/api/payload", async (c) => {
    const defaultRunLimit = state.options.maxRuns ?? DEFAULT_MAX_RUNS;
    const runLimit = parseLimitParam(c.req.query("limit") ?? null, defaultRunLimit);
    const cachedPayload = await getOrBuildPayload(state, runLimit);
    c.header("Content-Type", "application/json; charset=utf-8");
    c.header("Cache-Control", HTTP_NO_STORE);
    return c.body(cachedPayload.rawJson);
  });

  app.get("/*", (c) => {
    const resolved = resolveStaticFile(c.req.path);
    if (resolved === null) {
      return c.text("Forbidden", 403);
    }

    let staticAsset = state.assetMemoryCache.get(c.req.path);
    if (staticAsset === undefined) {
      try {
        staticAsset = loadAsset(resolved.filePath, resolved.httpCacheControl);
        state.assetMemoryCache.set(c.req.path, staticAsset);
      } catch {
        return c.text("Not found", 404);
      }
    }

    if (c.req.header("if-none-match") === staticAsset.etag) {
      return c.body(null, 304);
    }
    c.header("Content-Type", staticAsset.contentType);
    c.header("Cache-Control", staticAsset.httpCacheControl);
    c.header("ETag", staticAsset.etag);
    return c.body(asArrayBuffer(staticAsset.content));
  });

  const server = createAdaptorServer(app) as Server;

  try {
    const watcher = watch(options.benchResultsDir, { persistent: false }, () => {
      state.payloadMemoryCache = null;
    });
    server.once("close", () => watcher.close());
  } catch {
    // directory isn't found — watcher unavailable, cache cleared on each miss anyway
  }

  return server;
}
