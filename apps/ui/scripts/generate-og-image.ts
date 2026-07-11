/**
 * Regenerate the OG link-preview image from the component registry.
 *
 * Counts `src/registry/<slug>/meta.ts` — the same population behind the site's
 * `COMPONENTS.length` — rewrites the "NN+" count in `public/og-image.svg`, and renders
 * `public/og-image.png` (1200x630) with resvg using vendored Inter TTFs for deterministic output.
 *
 * Run with `pnpm --filter @apps/ui generate:og` after adding or removing components.
 */

import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const svgPath = join(appRoot, "public/og-image.svg");
const pngPath = join(appRoot, "public/og-image.png");

const registryDir = join(appRoot, "src/registry");
const componentCount = readdirSync(registryDir, { withFileTypes: true }).filter(
  (entry) => entry.isDirectory() && existsSync(join(registryDir, entry.name, "meta.ts")),
).length;
const countLabel = `${componentCount}+`;

const svg = readFileSync(svgPath, "utf8");

if (!/\d+\+ components/.test(svg)) {
  throw new Error(`No "NN+ components" text found in ${svgPath} — was the sub line reworded?`);
}

const patchedSvg = svg.replace(/\d+\+ components/, `${countLabel} components`);

if (patchedSvg !== svg) {
  writeFileSync(svgPath, patchedSvg);
}

// The SVG declares "Inter" first in its font stack; only these files are loaded, so the render is identical on every machine.
const require = createRequire(import.meta.url);
const image = new Resvg(patchedSvg, {
  font: {
    loadSystemFonts: false,
    defaultFontFamily: "Inter",
    fontFiles: [
      require.resolve("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
      require.resolve("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
      require.resolve("@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf"),
    ],
  },
}).render();

writeFileSync(pngPath, image.asPng());
console.log(
  `og-image: ${componentCount} registry components -> "${countLabel} components", rendered ${image.width}x${image.height} png`,
);
