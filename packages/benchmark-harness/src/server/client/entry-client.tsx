import "./styles.css";
import { Chart, registerables } from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { StrictMode } from "react";
import { hydrateRoot } from "react-dom/client";
import { App } from "#/server/client/components/app";
import type { EmbeddedViewerPayload } from "#/server/server-types";

Chart.register(...registerables, zoomPlugin);

const payload = (window as Window & { __BENCH_PAYLOAD__?: EmbeddedViewerPayload })
  .__BENCH_PAYLOAD__;

hydrateRoot(
  document.getElementById("root")!,
  <StrictMode>
    <App initialPayload={payload} />
  </StrictMode>,
);
