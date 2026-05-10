import type { IncomingMessage, Server, ServerResponse } from "node:http";
import { createServer } from "node:http";
import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildEmbeddedPayload } from "#/server/build-payload";
import { renderDocument } from "#/server/client/entry-server";
import { listRawRuns } from "#/server/read-runs";
import type { BenchServerOptions } from "#/server/server-types";

const clientDir = join(dirname(fileURLToPath(import.meta.url)), "client");

const IMMUTABLE = "public, max-age=31536000, immutable";
const NO_STORE = "no-store";

interface CachedAsset {
  content: Buffer;
  contentType: string;
  cacheControl: string;
  etag: string;
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

/**
 * Creates an HTTP server for the benchmark history viewer.
 *
 * Bind to loopback (`127.0.0.1`) unless you intend to expose benchmark results on the network:
 * routes stream JSON and HTML derived from {@link BenchServerOptions.benchResultsDir}.
 *
 * @since 0.3.16-canary.0
 */
export function createBenchServer(options: BenchServerOptions): Server {
  const clientJs = loadAsset(
    join(clientDir, "client.js"),
    "application/javascript; charset=utf-8",
    IMMUTABLE,
  );
  const stylesCss = loadAsset(join(clientDir, "styles.css"), "text/css; charset=utf-8", IMMUTABLE);

  const chunksDir = resolve(clientDir, "chunks");
  const chunkCache = new Map<string, CachedAsset>();

  return createServer((req, res) => {
    const url = new URL(req.url ?? "/", "http://localhost");

    if (url.pathname === "/") {
      try {
        const { runs: rawRuns, warning } = listRawRuns(options.benchResultsDir);
        const payload = buildEmbeddedPayload(rawRuns, options, warning);
        const etag = computeEtag(JSON.stringify(payload));
        if (req.headers["if-none-match"] === etag) {
          res.writeHead(304);
          res.end();
          return;
        }
        res.setHeader("Cache-Control", IMMUTABLE);
        res.setHeader("ETag", etag);
        renderDocument(payload, res, req);
      } catch (err) {
        res.writeHead(500, { "Content-Type": "text/plain" });
        res.end(String(err));
      }
      return;
    }

    if (url.pathname === "/client.js") {
      serveAsset(clientJs, req, res);
      return;
    }

    if (url.pathname === "/styles.css") {
      serveAsset(stylesCss, req, res);
      return;
    }

    const chunkMatch = /^\/chunks\/([^/]+\.js)$/.exec(url.pathname);
    if (chunkMatch) {
      const name = chunkMatch[1]!;
      const chunkPath = resolve(chunksDir, name);
      if (!chunkPath.startsWith(chunksDir + "/")) {
        res.writeHead(400);
        res.end("Bad request");
        return;
      }
      let chunk = chunkCache.get(name);
      if (!chunk) {
        chunk = loadAsset(chunkPath, "application/javascript; charset=utf-8", IMMUTABLE);
        chunkCache.set(name, chunk);
      }
      serveAsset(chunk, req, res);
      return;
    }

    if (url.pathname === "/api/payload") {
      try {
        const { runs: rawRuns, warning } = listRawRuns(options.benchResultsDir);
        const payload = buildEmbeddedPayload(rawRuns, options, warning);
        res.writeHead(200, {
          "Content-Type": "application/json; charset=utf-8",
          "Cache-Control": NO_STORE,
        });
        res.end(JSON.stringify(payload));
      } catch (err) {
        res.writeHead(500, { "Content-Type": "application/json" });
        res.end(JSON.stringify({ error: String(err) }));
      }
      return;
    }

    res.writeHead(404);
    res.end("Not found");
  });
}
