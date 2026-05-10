import type { IncomingMessage, ServerResponse } from "node:http";
import { Transform } from "node:stream";
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { App } from "#/server/client/components/app";
import type { EmbeddedViewerPayload } from "#/server/server-types";

const HTML_SUFFIX = Buffer.from("</div></body></html>");

function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function buildHtmlPrefix(payloadJson: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
<title>${escapeHtml(title)}</title>
<link href="/styles.css" rel="stylesheet" />
<script>window.__BENCH_PAYLOAD__=${payloadJson};</script>
<script defer src="/client.js"></script>
</head>
<body class="bh-app-body bh-app-body--viewer">
<div id="root">`;
}

function safeEndHtmlSuffix(res: ServerResponse): void {
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

export function renderDocument(
  payload: EmbeddedViewerPayload,
  res: ServerResponse,
  req: IncomingMessage,
): void {
  const payloadJson = JSON.stringify(payload).replace(/</g, "\\u003c");
  const pageTitle = payload.title.trim();

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
        abort(error);
        safeEndHtmlSuffix(res);
      },
      onError(error) {
        console.error("[bench-server] SSR error:", error);
      },
    },
  );

  function disconnectAbort(): void {
    if (!res.writableEnded && !res.destroyed) {
      abort(new DOMException("Client disconnected", "AbortError"));
    }
  }

  req.once("aborted", disconnectAbort);

  const { socket } = req;
  if (socket !== null && !socket.destroyed) {
    socket.once("close", () => {
      if (!res.writableEnded && !res.destroyed) {
        disconnectAbort();
      }
    });
  }
}
