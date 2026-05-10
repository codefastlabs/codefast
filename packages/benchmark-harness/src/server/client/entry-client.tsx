import "./styles.css";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "#/server/client/components/app";
import type { EmbeddedViewerPayload } from "#/server/server-types";

const payload = (window as Window & { __BENCH_PAYLOAD__?: EmbeddedViewerPayload })
  .__BENCH_PAYLOAD__;

hydrateRoot(
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  document.getElementById("root")!,
  <StrictMode>
    <App initialPayload={payload} />
  </StrictMode>,
);
