/** One PNG of every chart on screen, stacked in reading order. */
import type { Chart } from "chart.js";

/** The space between two stacked charts, in CSS pixels — the page's own gap between them. */
const STACK_GAP = 12;

/**
 * Renders charts top to bottom into one PNG data URL, on the given background.
 *
 * @remarks Chart canvases are transparent, so the background keeps the lines legible outside the page.
 *
 * @since 0.10.3
 */
export function stackChartImages(charts: ReadonlyArray<Chart>, background: string): string {
  const pixelRatio = charts[0]?.currentDevicePixelRatio ?? 1;
  const gap = Math.round(STACK_GAP * pixelRatio);
  const width = Math.max(0, ...charts.map((chart) => chart.canvas.width));
  const height = charts.reduce((total, chart) => total + chart.canvas.height, 0) + gap * Math.max(0, charts.length - 1);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (context === null) {
    return charts[0]?.toBase64Image("image/png", 1) ?? "";
  }
  context.fillStyle = background;
  context.fillRect(0, 0, width, height);
  let top = 0;
  for (const chart of charts) {
    context.drawImage(chart.canvas, 0, top);
    top += chart.canvas.height + gap;
  }
  return canvas.toDataURL("image/png");
}
