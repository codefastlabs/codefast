import type { ServerResponse } from "node:http";
import { Transform } from "node:stream";
import { StrictMode } from "react";
import { renderToPipeableStream } from "react-dom/server";
import { App } from "#/server/client/components/app";
import type { EmbeddedViewerPayload } from "#/server/server-types";

const HTML_SUFFIX = Buffer.from("</div></body></html>");

function buildHtmlPrefix(payloadJson: string, title: string): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta content="width=device-width, initial-scale=1, viewport-fit=cover" name="viewport" />
<title>${title} — bench history</title>
<link href="/styles.css" rel="stylesheet" />
<script>window.__BENCH_PAYLOAD__=${payloadJson};</script>
</head>
<body class="bh-app-body bh-app-body--viewer">
<div id="root">`;
}

export function renderDocument(payload: EmbeddedViewerPayload, res: ServerResponse): void {
  const payloadJson = JSON.stringify(payload).replace(/</g, "\\u003c");
  const docTitle = payload.title.trim();
  const pageTitle = /bench history\s*$/i.test(docTitle) ? docTitle : docTitle;

  res.setHeader("content-type", "text/html; charset=utf-8");
  res.write(buildHtmlPrefix(payloadJson, pageTitle));

  const { pipe } = renderToPipeableStream(
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
        appendSuffix.pipe(res);
        pipe(appendSuffix);
      },
      onShellError(error) {
        console.error("[bench-server] SSR shell error:", error);
        res.end(HTML_SUFFIX);
      },
      onError(error) {
        console.error("[bench-server] SSR error:", error);
      },
    },
  );
}
