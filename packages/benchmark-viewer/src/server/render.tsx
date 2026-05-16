import type { IncomingMessage, ServerResponse } from "node:http";
import { Transform } from "node:stream";
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { App } from "#/app/components/app";
import { escHtml } from "#/app/lib/format";
import type { EmbeddedViewerPayload } from "#/types";

const HTML_SUFFIX = Buffer.from("</div></body></html>");

const FAVICON_SVG = [
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">',
  '<rect width="32" height="32" rx="7" fill="#0a0a0e"/>',
  '<rect width="32" height="32" rx="7" fill="none" stroke="rgba(255,255,255,0.08)" stroke-width="0.75"/>',
  '<rect x="4" y="21" width="6" height="7" rx="1.8" fill="#0a84ff" opacity="0.38"/>',
  '<rect x="13" y="15" width="6" height="13" rx="1.8" fill="#0a84ff" opacity="0.68"/>',
  '<rect x="22" y="8" width="6" height="20" rx="1.8" fill="#409cff"/>',
  '<circle cx="25" cy="6.5" r="3.5" fill="white" opacity="0.14"/>',
  '<circle cx="25" cy="6.5" r="2" fill="white" opacity="0.92"/>',
  "</svg>",
].join("");

const FAVICON_HREF = `data:image/svg+xml;base64,${Buffer.from(FAVICON_SVG).toString("base64")}`;

function safeScriptJson(rawJson: string): string {
  return rawJson.replace(/</g, "\\u003c");
}

function buildHtmlPrefix(payloadJson: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
<title>${escHtml(title)}</title>
<link rel="icon" type="image/svg+xml" href="${FAVICON_HREF}" />
<link href="/styles.css" rel="stylesheet" />
<script>window.__BENCH_PAYLOAD__=${payloadJson};</script>
<script type="module" src="/entry.js"></script>
</head>
<body class="font-bh bg-bh-bg min-h-screen overflow-x-clip text-zinc-200 bg-[radial-gradient(ellipse_130%_70%_at_50%_-25%,var(--color-bh-glow-blue),transparent_52%),radial-gradient(ellipse_70%_45%_at_95%_35%,var(--color-bh-glow-green),transparent_42%),linear-gradient(180deg,var(--color-bh-bg-gradient-top)_0%,var(--color-bh-bg)_45%,var(--color-bh-bg-gradient-bottom)_100%)] bg-fixed antialiased [text-rendering:optimizeLegibility] motion-safe:scroll-smooth">
<div id="root">`;
}

function safeEnd(res: ServerResponse): void {
  if (res.writableEnded || res.destroyed) {
    return;
  }
  try {
    res.end(HTML_SUFFIX);
  } catch {
    try {
      res.destroy();
    } catch {
      /* ignore */
    }
  }
}

/**
 * @since 0.3.16-canary.1
 */
export function renderDocument(
  req: IncomingMessage,
  res: ServerResponse,
  payload: EmbeddedViewerPayload,
  rawJson: string,
): void {
  const pageTitle = payload.title.trim();
  const payloadJson = safeScriptJson(rawJson);

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.write(buildHtmlPrefix(payloadJson, pageTitle));

  const { pipe, abort } = renderToPipeableStream(
    <StrictMode>
      <App initialPayload={payload} />
    </StrictMode>,
    {
      onShellReady() {
        const appendSuffix = new Transform({
          transform(chunk, _encoding, callback) {
            callback(null, chunk);
          },
          flush(callback) {
            callback(null, HTML_SUFFIX);
          },
        });

        appendSuffix.once("error", (err: Error) => {
          console.error("[bench-server] SSR transform error:", err);
          abort(err);
        });

        appendSuffix.pipe(res);

        res.once("error", (err: Error) => {
          console.error("[bench-server] response stream error:", err);
          abort(err);
        });

        pipe(appendSuffix);
      },
      onShellError(error) {
        console.error("[bench-server] SSR shell error:", error);
        safeEnd(res);
      },
      onError(error) {
        console.error("[bench-server] SSR error:", error);
      },
    },
  );

  const { socket } = req;
  if (socket !== null && !socket.destroyed) {
    socket.once("close", () => {
      if (!res.writableEnded && !res.destroyed) {
        abort(new DOMException("Client disconnected", "AbortError"));
      }
    });
  }
}
