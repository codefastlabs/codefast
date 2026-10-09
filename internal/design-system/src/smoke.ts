import { JSDOM, VirtualConsole } from "jsdom";

import type { OutputFile } from "#output";

/** Browser APIs the components touch that jsdom does not implement; no-ops are enough to mount them. */
const POLYFILLS = `
window.ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
window.IntersectionObserver ??= class { observe() {} unobserve() {} disconnect() {} takeRecords() { return []; } };
window.matchMedia ??= () => ({ matches: false, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} });
window.HTMLElement.prototype.scrollIntoView ??= () => {};
`;

function text(file: OutputFile | undefined): string {
  return typeof file?.content === "string" ? file.content : (file?.content.toString("utf8") ?? "");
}

/**
 * Mounts every preview in jsdom on the real runtime scripts and reports the cards that throw or log an error.
 *
 * @remarks
 * This catches what a type check cannot: a demo that needs a provider the frame lacks, or a part the bundle misses.
 *
 * @since 0.1.0
 */
export async function checkPreviews(files: Array<OutputFile>, runtimeOrder: Array<string>): Promise<Array<string>> {
  const byPath = new Map(files.map((file) => [file.path, file]));
  const runtime = runtimeOrder.map((path) => text(byPath.get(`project/${path}`)));
  const failures: Array<string> = [];
  for (const file of files.filter((candidate) =>
    /^project\/components\/(?!Cover\/)\w+\/preview\.html$/.test(candidate.path),
  )) {
    const errors: Array<string> = [];
    const virtualConsole = new VirtualConsole();
    virtualConsole.on("jsdomError", (error) => errors.push(error.message));
    virtualConsole.on("error", (...messages: Array<unknown>) => errors.push(messages.map(String).join(" ")));
    // `outside-only` leaves the page's own script inert; it is read back and run after the runtime instead.
    const dom = new JSDOM(text(file), {
      pretendToBeVisual: true,
      runScripts: "outside-only",
      url: "https://design-system.invalid/",
      virtualConsole,
    });
    dom.window.document.documentElement.dataset.theme = "light";
    const script = dom.window.document.querySelector("script")?.textContent ?? "";
    try {
      for (const source of [POLYFILLS, ...runtime, script]) {
        dom.window.eval(source);
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    } catch (error) {
      errors.push(error instanceof Error ? error.message : String(error));
    }
    if (errors.length > 0) {
      failures.push(`${file.path}: ${errors[0]?.slice(0, 240)}`);
    }
    dom.window.close();
  }
  return failures;
}
