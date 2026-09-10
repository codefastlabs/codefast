import { createHash } from "node:crypto";
import { existsSync, watch } from "node:fs";
import type { FSWatcher } from "node:fs";
import { readFile } from "node:fs/promises";
import type { Server } from "node:http";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { readRunObservations, resolveRunDirectory } from "@codefast/benchmark-harness/parent/bench-run-artifacts";
import { parseRunObservations } from "@codefast/benchmark-harness/report/jsonl";
import { createAdaptorServer } from "@hono/node-server";
import { Hono } from "hono";
import { stream } from "hono/streaming";

import { DEFAULT_MAX_RUNS } from "#/constants";
import { buildEmbeddedPayload, listRawRuns } from "#/server/payload";
import { renderDocument } from "#/server/render";
import type { BenchServerOptions, EmbeddedViewerPayload } from "#/types";

const appDir = join(dirname(fileURLToPath(import.meta.url)), "..", "app");
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

// Assets ship under stable names (no content hash), so the browser must revalidate; the ETag
// keeps every unchanged response a 304.
const HTTP_NO_CACHE = "no-cache";
const HTTP_NO_STORE = "no-store";

const PAYLOAD_CACHE_MAX_ENTRIES = 8;

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
  etag: string;
}

interface InMemoryPayload {
  payload: EmbeddedViewerPayload;
  rawJson: string;
  etag: string;
}

interface ServerState {
  assetMemoryCache: Map<string, InMemoryAsset>;
  options: BenchServerOptions;
  payloadMemoryCache: Map<number, InMemoryPayload>;
  resultsWatcher: FSWatcher | null;
}

function computeEtag(hashInput: Buffer | string): string {
  return `"${createHash("sha1").update(hashInput).digest("hex").slice(0, 16)}"`;
}

function asArrayBuffer(nodeBuffer: Buffer): ArrayBuffer {
  return nodeBuffer.buffer.slice(nodeBuffer.byteOffset, nodeBuffer.byteOffset + nodeBuffer.byteLength) as ArrayBuffer;
}

async function loadAsset(filePath: string): Promise<InMemoryAsset> {
  const fileBytes = await readFile(filePath);
  const contentType = CONTENT_TYPES[extname(filePath)] ?? "application/octet-stream";
  return { content: fileBytes, contentType, etag: computeEtag(fileBytes) };
}

function resolveStaticFile(pathname: string): string | null {
  const stripped = pathname.slice(1);

  const appPath = resolve(appDir, stripped);
  if (appPath.startsWith(appDir + "/") && existsSync(appPath)) {
    return appPath;
  }

  const publicPath = resolve(publicDir, stripped);
  if (publicPath.startsWith(publicDir + "/")) {
    return publicPath;
  }

  return null;
}

function parseLimitParam(limitParam: string | null, defaultLimit: number): number {
  if (limitParam === null) {
    return defaultLimit;
  }
  const parsedLimit = Number(limitParam);
  return Number.isInteger(parsedLimit) && parsedLimit > 0 ? Math.min(parsedLimit, 10_000) : defaultLimit;
}

// Recursive so a run's observations.jsonl landing inside a new run directory also invalidates —
// the directory's own creation event can fire before the file is written.
function watchBenchResults(state: ServerState, onInvalidate: () => void): void {
  if (state.resultsWatcher !== null) {
    return;
  }
  try {
    state.resultsWatcher = watch(state.options.benchResultsDir, { persistent: false, recursive: true }, onInvalidate);
  } catch {
    // Directory missing — retried before the next payload build; warning payloads are never cached.
  }
}

async function getOrBuildPayload(state: ServerState, runLimit: number): Promise<InMemoryPayload> {
  const cached = state.payloadMemoryCache.get(runLimit);
  if (cached !== undefined) {
    return cached;
  }
  // Attach (or re-attach) before reading, so no change between read and watch goes unseen.
  watchBenchResults(state, () => state.payloadMemoryCache.clear());
  const { runs: rawRuns, hasMore, warning } = await listRawRuns(state.options.benchResultsDir, runLimit);
  const payload = buildEmbeddedPayload(rawRuns, state.options, hasMore, runLimit, warning);
  const rawJson = JSON.stringify(payload);
  const payloadEntry: InMemoryPayload = {
    payload,
    rawJson,
    etag: computeEtag(rawJson),
  };
  if (warning === undefined) {
    if (state.payloadMemoryCache.size >= PAYLOAD_CACHE_MAX_ENTRIES) {
      const oldestLimit = state.payloadMemoryCache.keys().next().value;
      if (oldestLimit !== undefined) {
        state.payloadMemoryCache.delete(oldestLimit);
      }
    }
    state.payloadMemoryCache.set(runLimit, payloadEntry);
  }
  return payloadEntry;
}

// A run id reaches the report route from the query string; reject anything that is not a bare id.
function isSafeRunId(runParam: string): boolean {
  return !runParam.includes("/") && !runParam.includes("\\") && !runParam.includes("..");
}

type DerivedReportResult =
  | { readonly runId: string; readonly markdown: string; readonly comparisonJson: string }
  | { readonly error: string; readonly status: 400 | 404 | 501 };

// Resolves a run and derives its report on demand, so the viewer serves what a run no longer stores.
function deriveRunReport(options: BenchServerOptions, runParam: string | undefined): DerivedReportResult {
  if (options.deriveReport === undefined) {
    return { error: "This viewer does not derive reports.", status: 501 };
  }
  if (runParam !== undefined && !isSafeRunId(runParam)) {
    return { error: "Invalid run id.", status: 400 };
  }
  const packageRootDirectory = dirname(options.benchResultsDir);
  let resolved;
  try {
    resolved = resolveRunDirectory(packageRootDirectory, runParam);
  } catch {
    return { error: "No such run.", status: 404 };
  }
  const parsed = parseRunObservations(readRunObservations(resolved.runDirectory));
  const report = options.deriveReport(parsed, { runId: resolved.runId });
  if (report === undefined) {
    return { error: "Run has no valid observations.", status: 404 };
  }
  return { runId: resolved.runId, markdown: report.markdown, comparisonJson: report.comparisonJson };
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
  const state: ServerState = {
    assetMemoryCache: new Map(),
    options,
    payloadMemoryCache: new Map(),
    resultsWatcher: null,
  };
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

  app.get("/api/report.md", (c) => {
    const result = deriveRunReport(state.options, c.req.query("run"));
    if ("error" in result) {
      return c.text(result.error, result.status);
    }
    c.header("Content-Type", "text/markdown; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="report-${result.runId}.md"`);
    c.header("Cache-Control", HTTP_NO_STORE);
    return c.body(result.markdown);
  });

  app.get("/api/report.json", (c) => {
    const result = deriveRunReport(state.options, c.req.query("run"));
    if ("error" in result) {
      return c.text(result.error, result.status);
    }
    c.header("Content-Type", "application/json; charset=utf-8");
    c.header("Content-Disposition", `attachment; filename="report-${result.runId}.json"`);
    c.header("Cache-Control", HTTP_NO_STORE);
    return c.body(result.comparisonJson);
  });

  app.get("/*", async (c) => {
    const resolvedFilePath = resolveStaticFile(c.req.path);
    if (resolvedFilePath === null) {
      return c.text("Forbidden", 403);
    }

    let staticAsset = state.assetMemoryCache.get(c.req.path);
    if (staticAsset === undefined) {
      try {
        staticAsset = await loadAsset(resolvedFilePath);
        state.assetMemoryCache.set(c.req.path, staticAsset);
      } catch {
        return c.text("Not found", 404);
      }
    }

    if (c.req.header("if-none-match") === staticAsset.etag) {
      return c.body(null, 304);
    }
    c.header("Content-Type", staticAsset.contentType);
    c.header("Cache-Control", HTTP_NO_CACHE);
    c.header("ETag", staticAsset.etag);
    return c.body(asArrayBuffer(staticAsset.content));
  });

  const server = createAdaptorServer(app) as Server;

  watchBenchResults(state, () => state.payloadMemoryCache.clear());
  server.once("close", () => state.resultsWatcher?.close());

  return server;
}
