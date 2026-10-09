import { readFileSync } from "node:fs";

import tailwind from "@tailwindcss/postcss";
import postcss from "postcss";

import { readBlock, readDeclarations } from "#css";
import type { OutputFile } from "#output";
import { packagePath, REGISTRY_ROOT, repoPath, WORK_ROOT } from "#paths";

/** The site's own `ui-*` colors, which some registry demos use, rewired to the frame's `data-theme`. */
function siteColors(): Array<string> {
  const css = readFileSync(repoPath("apps/web/src/styles.css"), "utf8");
  const own = (declarations: ReturnType<typeof readDeclarations>, prefix: string) =>
    declarations
      .filter((declaration) => declaration.name.startsWith(prefix))
      .map(({ name, value }) => `--${name}: ${value};`);
  return [
    `@theme { ${own(readDeclarations(css), "color-ui-").join(" ")} }`,
    `:root { ${own(readBlock(css, ":root"), "ui-").join(" ")} }`,
    `[data-theme="dark"] { ${own(readBlock(css, ".dark"), "ui-").join(" ")} }`,
  ];
}

/**
 * Compiles the preset, and every class the components and their demos use, into `bundle.css`.
 *
 * @remarks
 * No palette is imported and the preset's `--radius` default is dropped: those values come from the artifact's
 * `tokens.css`, so an edit on the page reaches the previews. Dark mode follows the frame's `data-theme`.
 */
export async function buildStyles(): Promise<OutputFile> {
  const input = [
    '@import "tailwindcss";',
    '@import "@codefast/ui/css/preset.css";',
    "@custom-variant dark (&:where([data-theme=dark], [data-theme=dark] *));",
    ...siteColors(),
    `@source ${JSON.stringify(REGISTRY_ROOT)};`,
    `@source ${JSON.stringify(packagePath("src"))};`,
    `@source ${JSON.stringify(WORK_ROOT)};`,
    "",
  ].join("\n");
  const result = await postcss([tailwind({ optimize: { minify: true } })]).process(input, {
    from: packagePath("src/bundle.css"),
  });
  const css = result.css.replace(/(:root\{[^}]*?);?--radius:[^;}]+;?/, "$1");
  if (/:root[^{]*\{[^}]*--radius:/.test(css)) {
    throw new Error("bundle.css still declares the preset's --radius default");
  }
  if (/<\/style/i.test(css)) {
    throw new Error("bundle.css contains a literal </style");
  }
  return {
    content: `/* Codefast UI components — Tailwind CSS build of the @codefast/ui preset and the classes its components and demos use. */\n${css}`,
    kind: "file",
    path: "project/components/bundle.css",
  };
}
