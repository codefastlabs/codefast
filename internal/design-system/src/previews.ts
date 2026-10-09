import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { bundleScript } from "#bundler";
import { CARD_HEIGHTS } from "#config";
import type { OutputFile } from "#output";
import { packagePath, REGISTRY_ROOT, WORK_ROOT } from "#paths";
import type { ComponentCard } from "#registry";

const PROVIDED = new Set(["CodefastUI", "React", "ReactDOM", "Recharts"] as const);

function entrySource(card: ComponentCard): string {
  const modules = [
    `${REGISTRY_ROOT}/${card.slug}/demo.tsx`,
    ...card.picks.map((pick) => `${REGISTRY_ROOT}/${card.slug}/${pick.stem}.example.tsx`),
  ];
  const titles = ["", ...card.picks.map((pick) => pick.title)];
  return [
    `import { createElement } from "react";`,
    `import { createRoot } from "react-dom/client";`,
    `import { PreviewFrame } from ${JSON.stringify(packagePath("src/preview-frame.tsx"))};`,
    ...modules.map((path, index) => `import * as M${index} from ${JSON.stringify(path)};`),
    `const demo = (module) => Object.values(module).find((value) => typeof value === "function");`,
    `const sections = [${modules.map((_path, index) => `{ Demo: demo(M${index}), title: ${JSON.stringify(titles[index])} }`).join(", ")}];`,
    `createRoot(document.getElementById("root")).render(createElement(PreviewFrame, { sections }));`,
    "",
  ].join("\n");
}

/**
 * Writes each card's bundle entry, where Tailwind can also scan it for the classes the previews use.
 *
 * @since 0.1.0
 */
export function writePreviewEntries(cards: Array<ComponentCard>): void {
  mkdirSync(join(WORK_ROOT, "previews"), { recursive: true });
  for (const card of cards) {
    writeFileSync(join(WORK_ROOT, "previews", `${card.slug}.jsx`), entrySource(card));
  }
}

/**
 * Compiles each card's registry demo, and the examples picked for it, into a self-contained `preview.html`.
 *
 * @remarks
 * The demos run against the bundle's globals, so a preview carries only its own code.
 *
 * @since 0.1.0
 */
export async function buildPreviews(cards: Array<ComponentCard>): Promise<Array<OutputFile>> {
  const files: Array<OutputFile> = [];
  for (const card of cards) {
    const script = await bundleScript(join(WORK_ROOT, "previews", `${card.slug}.jsx`), PROVIDED);
    const height = CARD_HEIGHTS[card.slug] ?? (card.category === "overlay" ? 420 : 120 + card.picks.length * 90);
    files.push({
      content: [
        `<!-- @dsCard group="${card.group}" height=${height} -->`,
        "<!doctype html>",
        "<html>",
        `<head><meta charset="utf-8"><title>${card.name} — preview</title></head>`,
        "<body>",
        '<div id="root"></div>',
        `<script>\n${script}\n</script>`,
        "</body>",
        "</html>",
        "",
      ].join("\n"),
      kind: "file",
      path: `project/components/${card.name}/preview.html`,
    });
  }
  files.push({
    content: readFileSync(packagePath("content/cover.html"), "utf8"),
    kind: "file",
    path: "project/components/Cover/preview.html",
  });
  return files;
}
