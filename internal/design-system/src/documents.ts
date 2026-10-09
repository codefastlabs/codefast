import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { PALETTE } from "#config";
import { readBlock, readDeclarations } from "#css";
import { packagePath, UI_ROOT } from "#paths";
import type { ContrastShortfall } from "#tokens";

const THEMES = join(UI_ROOT, "src/css/themes");

/** Writes the Palettes section: every palette `@codefast/ui` ships, read from its theme files. */
export function buildPalettes(): string {
  const rows = readdirSync(THEMES)
    .filter((file) => file.endsWith(".css"))
    .sort()
    .map((file) => {
      const css = readFileSync(join(THEMES, file), "utf8");
      const light = readBlock(css, ":root");
      const dark = readBlock(css, ".dark");
      const find = (block: typeof light, name: string) => block.find((token) => token.name === name);
      const cell = (token: ReturnType<typeof find>) =>
        token ? `\`${token.value}\` (${token.comment?.replace(/^--color-/, "") ?? "custom"})` : "—";
      const neutral = /--color-([a-z]+)-/.exec(find(light, "border")?.comment ?? "")?.[1] ?? "—";
      return {
        destructive: `${find(light, "destructive")?.value} / ${find(dark, "destructive")?.value}`,
        row: `| ${file.replace(/\.css$/, "")} | ${neutral} | ${cell(find(light, "primary"))} | ${cell(find(dark, "primary"))} |`,
      };
    });
  const destructive = new Set(rows.map((row) => row.destructive));
  return [
    "# Palettes",
    "",
    `The components read only the semantic tokens (\`background\`, \`primary\`, \`ring\`…), so a palette is a different set of values for the same names. This system's tokens are **${PALETTE}** — the palette codefastlabs.com ships. \`@codefast/ui\` offers ${rows.length}, one CSS file each under \`@codefast/ui/css/themes/\`; import exactly one, before the preset.`,
    "",
    "- Pick a palette by its `primary`: in most palettes it is the only token that carries hue. Surfaces, `border`, `muted` and `accent` come from the palette's neutral.",
    destructive.size === 1
      ? "- `destructive` is the same in every palette, so error states read alike whichever you pick."
      : "- `destructive` differs between palettes; check it against the grounds you use.",
    "",
    "| Palette | Neutral | `primary` light | `primary` dark |",
    "| --- | --- | --- | --- |",
    ...rows.map((row) => row.row),
    "",
    "Switch palette by swapping one import:",
    "",
    "```css",
    '@import "tailwindcss";',
    '@import "@codefast/ui/css/themes/emerald.css";',
    '@import "@codefast/ui/css/preset.css";',
    "```",
    "",
  ].join("\n");
}

function motionTable(): string {
  const declarations = readDeclarations(readFileSync(join(UI_ROOT, "src/css/foundation/motion.css"), "utf8"));
  const easing = declarations
    .filter((declaration) => declaration.name.startsWith("ease-"))
    .map(
      (declaration) =>
        `- \`${declaration.name}\` ${declaration.value}${declaration.comment ? ` — ${declaration.comment}` : ""}`,
    );
  const pairs = declarations
    .filter((declaration) => /^animation-duration-[\w-]+-in$/.test(declaration.name))
    .map((enter) => {
      const role = enter.name.replace(/^animation-duration-|-in$/g, "");
      const exit = declarations.find((declaration) => declaration.name === `animation-duration-${role}-out`);
      return `| ${enter.comment ?? role} | ${enter.value} | ${exit?.value ?? "—"} |`;
    });
  const controls = declarations
    .filter((declaration) => declaration.name.startsWith("transition-duration-"))
    .map(
      (declaration) =>
        `- \`duration-${declaration.name.replace("transition-duration-", "")}\` ${declaration.value}${declaration.comment ? ` — ${declaration.comment}` : ""}`,
    );
  return [
    "| Surface | Enter | Exit |",
    "| --- | --- | --- |",
    ...pairs,
    "",
    "Easing curves:",
    "",
    ...easing,
    "",
    "Form controls:",
    "",
    ...controls,
  ].join("\n");
}

function contrastNotes(shortfalls: Array<ContrastShortfall>): string {
  if (shortfalls.length === 0) {
    return "- Every checked text and focus pair meets its WCAG minimum in both schemes.";
  }
  return shortfalls
    .map(
      (shortfall) =>
        `- \`${shortfall.ink}\` on \`${shortfall.ground}\` measures ${shortfall.ratios.light.toFixed(1)}:1 light and ${shortfall.ratios.dark.toFixed(1)}:1 dark, under the ${shortfall.minimum}:1 ${shortfall.role} wants. Kept exact from the source — design around it rather than re-tinting.`,
    )
    .join("\n");
}

/** Fills the hand-written brand book with the values only the source can say: contrast and motion. */
export function buildBrandBook(shortfalls: Array<ContrastShortfall>): string {
  return readFileSync(packagePath("content/brand-book.md"), "utf8")
    .replace("{{contrast}}", contrastNotes(shortfalls))
    .replace("{{motion}}", motionTable());
}
