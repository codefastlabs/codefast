import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEmbeddedPayload } from "#/server/payload";
import { renderDocument } from "#/server/render";
import { listRawRuns } from "#/server/payload";
import type { BenchServerOptions } from "#/types";

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

interface ServerState {
  entryJs: CachedAsset;
  stylesCss: CachedAsset;
  chunksDir: string;
  chunkCache: Map<string, CachedAsset>;
  options: BenchServerOptions;
}

function computeEtag(data: Buffer | string): string {
  return `"${createHash("sha1").update(data).digest("hex").slice(0, 16)}"`;
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
  };
}

function handleRoot(state: ServerState, req: IncomingMessage, res: ServerResponse): void {
  try {
    const { runs: rawRuns, warning } = listRawRuns(state.options.benchResultsDir);
    const payload = buildEmbeddedPayload(rawRuns, state.options, warning);
    const etag = computeEtag(JSON.stringify(payload));
    if (req.headers["if-none-match"] === etag) {
      res.writeHead(304);
      res.end();
      return;
    }
    res.setHeader("Cache-Control", NO_CACHE);
    res.setHeader("ETag", etag);
    renderDocument(payload, res, req);
  } catch (err) {
    res.writeHead(500, { "Content-Type": "text/plain" });
    res.end(String(err));
  }
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

function handleApiPayload(state: ServerState, req: IncomingMessage, res: ServerResponse): void {
  try {
    const { runs: rawRuns, warning } = listRawRuns(state.options.benchResultsDir);
    const payload = buildEmbeddedPayload(rawRuns, state.options, warning);
    res.writeHead(200, {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": NO_STORE,
    });
    res.end(JSON.stringify(payload));
  } catch (err) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(err) }));
  }
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

  return createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
      return handleRoot(state, req, res);
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
      return handleApiPayload(state, req, res);
    }

    res.writeHead(404);
    res.end("Not found");
  });
}
