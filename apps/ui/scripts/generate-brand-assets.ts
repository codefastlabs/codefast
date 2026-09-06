/**
 * Regenerate every raster brand asset from its SVG source.
 *
 * - `public/favicon.ico`: the mark at 16, 32 and 48 px, packed as PNG entries.
 * - `public/apple-touch-icon.png`, `public/icon-192.png`, `public/icon-512.png`: the mark on Neutral 950,
 *   full-bleed so rounded and circular masks keep it whole.
 * - `public/og-image.png` (1200×630): the site's link preview, from `public/og-image.svg`.
 * - `public/og/<pkg>.png`: one per `packages/<pkg>/package.json`, from the inline template below.
 * - `public/brand/*.png`: the lockups and the README banner, rendered at 2× for retina screens.
 *
 * Renders with resvg and vendored Inter TTFs for deterministic output. Run with
 * `pnpm --filter @apps/ui generate:brand` after changing a brand source or adding a package.
 */

import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

import { Resvg } from "@resvg/resvg-js";

const appRoot = fileURLToPath(new URL("..", import.meta.url));
const publicDir = join(appRoot, "public");
const brandDir = join(publicDir, "brand");
const packageOgDir = join(publicDir, "og");
const packagesDir = join(appRoot, "../../packages");

// ── Palette ──────────────────────────────────────────────────────────────────────────────────────────────────────────

// The site's Tailwind 4 tokens resolved to sRGB, so a raster matches what the page renders.
const SKY_400 = "#00bcff";
const SKY_500 = "#00a6f4";
const SKY_600 = "#0084d1";
const NEUTRAL_50 = "#fafafa";
const NEUTRAL_400 = "#a1a1a1";
const NEUTRAL_500 = "#737373";
const NEUTRAL_900 = "#171717";
const NEUTRAL_950 = "#0a0a0a";

interface MarkTone {
  readonly lead: string;
  readonly trail: string;
}

const LIGHT_TONE: MarkTone = { lead: SKY_600, trail: NEUTRAL_900 };
const DARK_TONE: MarkTone = { lead: SKY_400, trail: NEUTRAL_50 };

const FONT_STYLE = `<style>text { font-family: "Inter", ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }</style>`;

// ── Rendering ────────────────────────────────────────────────────────────────────────────────────────────────────────

// Only these files are loaded, so the render is identical on every machine.
const require = createRequire(import.meta.url);
const fontOptions = {
  loadSystemFonts: false,
  defaultFontFamily: "Inter",
  fontFiles: [
    require.resolve("@expo-google-fonts/inter/500Medium/Inter_500Medium.ttf"),
    require.resolve("@expo-google-fonts/inter/600SemiBold/Inter_600SemiBold.ttf"),
    require.resolve("@expo-google-fonts/inter/700Bold/Inter_700Bold.ttf"),
    require.resolve("@expo-google-fonts/inter/800ExtraBold/Inter_800ExtraBold.ttf"),
  ],
};

/** Renders an SVG string to PNG, optionally scaled to `width` pixels for retina exports. */
function renderPng(source: string, width?: number): Buffer {
  const resvg = new Resvg(source, {
    font: fontOptions,
    ...(width === undefined ? {} : { fitTo: { mode: "width", value: width } }),
  });

  return resvg.render().asPng();
}

// ── Mark ─────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface MarkPlacement {
  readonly x: number;
  readonly y: number;
  readonly size: number;
  /** Brighter trail for renders at 32 px and under, so the fourth tile survives. */
  readonly small?: boolean;
}

/** The four tiles on their 64-unit grid, translated and scaled into place. */
function markTiles(tone: MarkTone, { x, y, size, small = false }: MarkPlacement): string {
  const [first, second, third] = small ? [0.5, 0.5, 0.25] : [0.4, 0.4, 0.15];

  return `<g transform="translate(${x} ${y}) scale(${size / 64})">
    <rect x="4" y="4" width="24" height="24" rx="6" fill="${tone.lead}" />
    <rect x="36" y="4" width="24" height="24" rx="6" fill="${tone.trail}" fill-opacity="${first}" />
    <rect x="4" y="36" width="24" height="24" rx="6" fill="${tone.trail}" fill-opacity="${second}" />
    <rect x="36" y="36" width="24" height="24" rx="6" fill="${tone.trail}" fill-opacity="${third}" />
  </g>`;
}

function svgDocument(width: number, height: number, body: string): string {
  return `<svg width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

/** The mark alone on a transparent canvas, for the favicon sizes. */
function markOnlySvg(size: number): string {
  return svgDocument(size, size, markTiles(LIGHT_TONE, { x: 0, y: 0, size, small: size <= 32 }));
}

/** The mark centred on Neutral 950 at `markRatio` of the canvas, for the app icons. */
function appIconSvg(size: number, markRatio: number): string {
  const markSize = Math.round(size * markRatio);
  const offset = (size - markSize) / 2;

  return svgDocument(
    size,
    size,
    `<rect width="${size}" height="${size}" fill="${NEUTRAL_950}" />${markTiles(DARK_TONE, { x: offset, y: offset, size: markSize })}`,
  );
}

// ── Lockups ──────────────────────────────────────────────────────────────────────────────────────────────────────────

function wordmark(x: number, y: number, fontSize: number, tone: MarkTone, anchor = "start"): string {
  return `<text x="${x}" y="${y}" font-size="${fontSize}" font-weight="600" letter-spacing="${(-0.02 * fontSize).toFixed(2)}" text-anchor="${anchor}" fill="${tone.trail}">codefast<tspan fill="${tone.lead}">labs</tspan></text>`;
}

/** Mark at 40 px beside the wordmark, on a transparent canvas. */
function horizontalLockupSvg(tone: MarkTone): string {
  return svgDocument(
    340,
    88,
    `${FONT_STYLE}${markTiles(tone, { x: 24, y: 24, size: 40 })}${wordmark(76, 57, 34, tone)}`,
  );
}

/** Mark at 72 px above the wordmark, on a transparent canvas. */
function stackedLockupSvg(tone: MarkTone): string {
  return svgDocument(
    240,
    168,
    `${FONT_STYLE}${markTiles(tone, { x: 84, y: 24, size: 72 })}${wordmark(120, 140, 28, tone, "middle")}`,
  );
}

/** The repository README banner: mark, wordmark and the one-line pitch on Neutral 950. */
function readmeBannerSvg(): string {
  return svgDocument(
    1280,
    320,
    `<defs>
      <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
        <circle cx="1" cy="1" r="1" fill="${NEUTRAL_50}" fill-opacity="0.14" />
      </pattern>
      <radialGradient id="fade" cx="640" cy="0" r="520" gradientUnits="userSpaceOnUse">
        <stop offset="0" stop-color="#ffffff" />
        <stop offset="1" stop-color="#000000" />
      </radialGradient>
      <mask id="dotsMask"><rect width="1280" height="320" fill="url(#fade)" /></mask>
      ${FONT_STYLE}
    </defs>
    <rect width="1280" height="320" fill="${NEUTRAL_950}" />
    <rect width="1280" height="320" fill="url(#dots)" mask="url(#dotsMask)" />
    <rect width="1280" height="4" fill="${SKY_500}" />
    ${markTiles(DARK_TONE, { x: 96, y: 104, size: 112 })}
    ${wordmark(248, 158, 64, DARK_TONE)}
    <text x="248" y="200" font-size="22" font-weight="500" fill="${NEUTRAL_400}">Open-source TypeScript packages for React 19 products, published under <tspan fill="${NEUTRAL_50}">@codefast</tspan>.</text>`,
  );
}

// ── ICO ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

interface IcoEntry {
  readonly size: number;
  readonly png: Buffer;
}

/** Packs PNG renders into one `.ico`: a 6-byte header, one 16-byte directory entry per image, then the images. */
function packIco(entries: ReadonlyArray<IcoEntry>): Buffer {
  const header = Buffer.alloc(6);

  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(entries.length, 4);

  let offset = header.length + 16 * entries.length;
  const directory = entries.map(({ size, png }) => {
    const entry = Buffer.alloc(16);

    entry.writeUInt8(size, 0);
    entry.writeUInt8(size, 1);
    entry.writeUInt8(0, 2);
    entry.writeUInt8(0, 3);
    entry.writeUInt16LE(1, 4);
    entry.writeUInt16LE(32, 6);
    entry.writeUInt32LE(png.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += png.length;

    return entry;
  });

  return Buffer.concat([header, ...directory, ...entries.map(({ png }) => png)]);
}

// ── Package cards ────────────────────────────────────────────────────────────────────────────────────────────────────

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

function packageCardSvg(manifest: PackageManifest): string {
  const [scope, bare] = manifest.name.split("/");
  const nameSize = manifest.name.length > 22 ? 64 : 84;
  const description = wrapLines(manifest.description ?? "", 52, 3)
    .map(
      (line, index) =>
        `<text x="80" y="${432 + index * 44}" font-size="30" font-weight="500" fill="${NEUTRAL_400}">${escapeXml(line)}</text>`,
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
      <stop offset="0" stop-color="${SKY_500}" stop-opacity="0.30" />
      <stop offset="1" stop-color="${SKY_500}" stop-opacity="0" />
    </radialGradient>
    ${FONT_STYLE}
  </defs>
  <rect width="1200" height="630" fill="url(#bg)" />
  <rect width="1200" height="630" fill="url(#glow)" />
  <rect x="0" y="0" width="1200" height="6" fill="${SKY_500}" />
  ${markTiles(DARK_TONE, { x: 80, y: 76, size: 40 })}
  ${wordmark(132, 108, 34, DARK_TONE)}
  <text x="78" y="330" font-size="${nameSize}" font-weight="800" letter-spacing="-2" fill="${NEUTRAL_50}">${escapeXml(scope ?? "")}/<tspan fill="${SKY_400}">${escapeXml(bare ?? manifest.name)}</tspan></text>
  <text x="80" y="375" font-size="26" font-weight="500" fill="${NEUTRAL_500}">v${escapeXml(manifest.version)} · TypeScript · React 19</text>
  ${description}
  <text x="80" y="566" font-size="24" font-weight="500" fill="${NEUTRAL_500}">codefastlabs.com/docs/${escapeXml(bare ?? "")}</text>
</svg>`;
}

// ── Run ──────────────────────────────────────────────────────────────────────────────────────────────────────────────

mkdirSync(brandDir, { recursive: true });
mkdirSync(packageOgDir, { recursive: true });

writeFileSync(
  join(publicDir, "favicon.ico"),
  packIco([16, 32, 48].map((size) => ({ size, png: renderPng(markOnlySvg(size)) }))),
);
writeFileSync(join(publicDir, "apple-touch-icon.png"), renderPng(appIconSvg(180, 100 / 180)));
writeFileSync(join(publicDir, "icon-192.png"), renderPng(appIconSvg(192, 0.5625)));
writeFileSync(join(publicDir, "icon-512.png"), renderPng(appIconSvg(512, 0.5625)));
console.log("brand: favicon.ico (16, 32, 48), apple-touch-icon.png, icon-192.png, icon-512.png");

writeFileSync(join(publicDir, "og-image.png"), renderPng(readFileSync(join(publicDir, "og-image.svg"), "utf8")));
console.log("brand: og-image.png from og-image.svg");

writeFileSync(join(brandDir, "lockup-horizontal.png"), renderPng(horizontalLockupSvg(LIGHT_TONE), 680));
writeFileSync(join(brandDir, "lockup-horizontal-dark.png"), renderPng(horizontalLockupSvg(DARK_TONE), 680));
writeFileSync(join(brandDir, "lockup-stacked.png"), renderPng(stackedLockupSvg(LIGHT_TONE), 480));
writeFileSync(join(brandDir, "lockup-stacked-dark.png"), renderPng(stackedLockupSvg(DARK_TONE), 480));
writeFileSync(join(brandDir, "readme-banner.png"), renderPng(readmeBannerSvg(), 2560));
console.log("brand: four lockups and readme-banner.png into public/brand/");

const packageDirs = readdirSync(packagesDir, { withFileTypes: true })
  .filter((entry) => entry.isDirectory() && existsSync(join(packagesDir, entry.name, "package.json")))
  .map((entry) => entry.name);

for (const pkg of packageDirs) {
  const manifest = JSON.parse(readFileSync(join(packagesDir, pkg, "package.json"), "utf8")) as PackageManifest;

  writeFileSync(join(packageOgDir, `${pkg}.png`), renderPng(packageCardSvg(manifest)));
}

console.log(`brand: rendered ${packageDirs.length} package cards into public/og/`);
