/**
 * Regenerate the OG link-preview images.
 *
 * - `public/og-image.png` (1200x630): the site image, from `public/og-image.svg` with the component
 *   count rewritten from `src/registry/<slug>/meta.ts` — the same population behind `COMPONENTS.length`.
 * - `public/og/<pkg>.png`: one per `packages/<pkg>/package.json`, drawn from an inline template with the
 *   package name, version, and description, for the `/docs/<pkg>` pages.
 *
 * Renders with resvg and vendored Inter TTFs for deterministic output. Run with
 * `pnpm --filter @apps/ui generate:og` after adding or removing components or packages.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const svgPath = join(appRoot, "public/og-image.svg");
const pngPath = join(appRoot, "public/og-image.png");
const packageOgDir = join(appRoot, "public/og");
const packagesDir = join(appRoot, "../../packages");

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

// The SVGs declare "Inter" first in their font stack; only these files are loaded, so the render is identical on every machine.
const require = createRequire(import.meta.url);
const fontOptions = {
  loadSystemFonts: false,
  defaultFontFamily: "Inter",
  fontFiles: [
    require.resolve("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
    require.resolve("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
    require.resolve("@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf"),
  ],
};

function renderPng(source: string): Buffer {
  return new Resvg(source, { font: fontOptions }).render().asPng();
}

writeFileSync(pngPath, renderPng(patchedSvg));
console.log(
  `og-image: ${componentCount} registry components -> "${countLabel} components", rendered public/og-image.png`,
);

// ── Package images ───────────────────────────────────────────────────────────────────────────────────────────────────

function escapeXml(text: string): string {
  return text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;");
}

/** SVG has no text wrapping, so the description is broken into lines by hand; the last line is ellipsised. */
function wrapLines(text: string, maxChars: number, maxLines: number): Array<string> {
  const lines: Array<string> = [];
  let current = "";

  for (const word of text.split(/\s+/).filter(Boolean)) {
    const candidate = current ? `${current} ${word}` : word;

    if (candidate.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = candidate;
    }
  }

  if (current) {
    lines.push(current);
  }

  if (lines.length > maxLines) {
    const kept = lines.slice(0, maxLines);
    const last = kept[maxLines - 1] ?? "";

    kept[maxLines - 1] = `${last.slice(0, Math.max(0, maxChars - 1)).trimEnd()}…`;

    return kept;
  }

  return lines;
}

interface PackageManifest {
  readonly name: string;
  readonly version: string;
  readonly description?: string;
}

function packageSvg(manifest: PackageManifest): string {
  const [scope, bare] = manifest.name.split("/");
  const nameSize = manifest.name.length > 22 ? 64 : 84;
  const description = wrapLines(manifest.description ?? "", 52, 3)
    .map(
      (line, index) =>
        `<text x="80" y="${432 + index * 44}" font-size="30" font-weight="500" fill="#a3a3a3">${escapeXml(line)}</text>`,
    )
    .join("\n  ");

  return `<svg width="1200" height="630" viewBox="0 0 1200 630" fill="none" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1200" y2="630" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#09090b" />
      <stop offset="1" stop-color="#0c1620" />
    </linearGradient>
    <radialGradient id="glow" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse"
      gradientTransform="translate(1000 90) rotate(130) scale(620 620)">
      <stop offset="0" stop-color="#0ea5e9" stop-opacity="0.30" />
      <stop offset="1" stop-color="#0ea5e9" stop-opacity="0" />
    </radialGradient>
    <style>
      text { font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
    </style>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect x="0" y="0" width="1200" height="6" fill="#0ea5e9" />
  <text x="80" y="120" font-size="34" font-weight="700" fill="#fafafa">codefast<tspan fill="#38bdf8">labs</tspan></text>
  <text x="78" y="330" font-size="${nameSize}" font-weight="800" letter-spacing="-2" fill="#fafafa">${escapeXml(scope ?? "")}/<tspan fill="#38bdf8">${escapeXml(bare ?? manifest.name)}</tspan></text>
  <text x="80" y="375" font-size="26" font-weight="500" fill="#71717a">v${escapeXml(manifest.version)} · TypeScript · React 19</text>
  ${description}
  <text x="80" y="566" font-size="24" font-weight="500" fill="#71717a">codefastlabs.com/docs/${escapeXml(bare ?? "")}</text>
</svg>`;
}

mkdirSync(packageOgDir, { recursive: true });

const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(packagesDir, entry.name, "package.json")))
  .map((entry) => entry.name);

for (const pkg of packageDirs) {
  const manifest = JSON.parse(readFileSync(join(packagesDir, pkg, "package.json"), "utf8")) as PackageManifest;

  writeFileSync(join(packageOgDir, `${pkg}.png`), renderPng(packageSvg(manifest)));
}

console.log(`og-image: rendered ${packageDirs.length} package images into public/og/`);
