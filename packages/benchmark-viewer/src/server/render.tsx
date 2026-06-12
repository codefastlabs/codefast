import { StrictMode } from "react";
import { renderToReadableStream } from "react-dom/server";

import { App } from "#/app/components/app";
import type { EmbeddedViewerPayload } from "#/types";

const htmlEncoder = new TextEncoder();
const HTML_DOCTYPE = htmlEncoder.encode("<!DOCTYPE html>");

function safeScriptJson(rawJson: string): string {
  return rawJson.replace(/</g, "\\u003c");
}

interface DocumentProps {
  pageTitle: string;
  payloadJson: string;
  payload: EmbeddedViewerPayload;
}

function Document({ pageTitle, payloadJson, payload }: DocumentProps) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <title>{pageTitle}</title>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
        <link href="/styles.css" rel="stylesheet" />
        <script dangerouslySetInnerHTML={{ __html: `window.__BENCH_PAYLOAD__=${payloadJson}` }} />
        <script type="module" src="/entry.js" />
      </head>
      <body className="bg-bh-bg font-bh min-h-screen overflow-x-clip bg-[radial-gradient(ellipse_130%_70%_at_50%_-25%,var(--color-bh-glow-blue),transparent_52%),radial-gradient(ellipse_70%_45%_at_95%_35%,var(--color-bh-glow-green),transparent_42%),linear-gradient(180deg,var(--color-bh-bg-gradient-top)_0%,var(--color-bh-bg)_45%,var(--color-bh-bg-gradient-bottom)_100%)] bg-fixed text-zinc-200 antialiased [text-rendering:optimizeLegibility] motion-safe:scroll-smooth">
        <div id="root">
          <App initialPayload={payload} />
        </div>
      </body>
    </html>
  );
}

/**
 * @since 0.3.16-canary.1
 */
export async function renderDocument(
  payload: EmbeddedViewerPayload,
  rawJson: string,
  requestSignal: AbortSignal,
): Promise<ReadableStream<Uint8Array>> {
  const reactStream = await renderToReadableStream(
    <StrictMode>
      <Document pageTitle={payload.title.trim()} payloadJson={safeScriptJson(rawJson)} payload={payload} />
    </StrictMode>,
    {
      signal: requestSignal,
      progressiveChunkSize: Number.POSITIVE_INFINITY,
      onError(error) {
        console.error("[bench-server] SSR error:", error);
      },
    },
  );

  return new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        controller.enqueue(HTML_DOCTYPE);
        for await (const chunk of reactStream) {
          controller.enqueue(chunk);
        }
        controller.close();
      } catch (streamError) {
        controller.error(streamError);
      }
    },
  });
}
