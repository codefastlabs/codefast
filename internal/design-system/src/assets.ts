import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import * as Lucide from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";

import { ICON_INK } from "#config";
import type { OutputFile } from "#output";
import { packagePath, repoPath, UI_ROOT } from "#paths";
import type { FontFile } from "#tokens";

const BRAND = repoPath("apps/web/public/brand");

function isIcon(value: unknown): value is LucideIcon {
  return typeof value === "object" && value !== null && "$$typeof" in value;
}

function kebab(name: string): string {
  return name
    .replace(/Icon$/, "")
    .replace(/([a-z])([A-Z0-9])/g, "$1-$2")
    .toLowerCase();
}

/** Exports every Lucide icon a component imports, plus a README naming which components render it. */
function buildIcons(): Array<OutputFile> {
  const components = join(UI_ROOT, "src/components");
  const users = new Map<string, Array<string>>();
  for (const file of readdirSync(components).sort()) {
    const source = readFileSync(join(components, file), "utf8");
    const names = /import\s*\{([^}]*)\}\s*from\s*"lucide-react"/.exec(source)?.[1] ?? "";
    for (const name of names
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean)) {
      users.set(name, [...(users.get(name) ?? []), file.replace(/\.tsx$/, "")]);
    }
  }
  const icons = new Map<string, unknown>(Object.entries(Lucide));
  const files: Array<OutputFile> = [...users.keys()].sort().map((name) => {
    const icon = icons.get(name);
    if (!isIcon(icon)) {
      throw new Error(`lucide-react exports no ${name}`);
    }
    const markup = renderToStaticMarkup(createElement(icon, { size: 24 }))
      .replace(/ class="[^"]*"/, "")
      .replaceAll("currentColor", ICON_INK);
    const svg = markup.includes("xmlns=")
      ? markup
      : markup.replace("<svg ", '<svg xmlns="http://www.w3.org/2000/svg" ');
    return { content: `${svg}\n`, kind: "upload", path: `project/assets/Icons/${kebab(name)}.svg` };
  });
  const list = [...users.entries()]
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([name, used]) => `- \`${kebab(name)}\` — ${used.join(", ")}`)
    .join("\n");
  files.push({
    content: `${readFileSync(packagePath("content/icons.md"), "utf8")}${list}\n`,
    kind: "file",
    path: "project/assets/Icons/README.md",
  });
  return files;
}

/** Copies the brand marks verbatim, with the hand-written guidance for them. */
function buildLogos(): Array<OutputFile> {
  return [
    ...readdirSync(BRAND)
      .filter((file) => /\.(png|svg)$/.test(file))
      .sort()
      .map((file): OutputFile => ({
        content: readFileSync(join(BRAND, file)),
        kind: "upload",
        path: `project/assets/Logos/${file}`,
      })),
    {
      content: readFileSync(packagePath("content/logos.md"), "utf8"),
      kind: "file",
      path: "project/assets/Logos/README.md",
    },
  ];
}

/** Collects the brand marks, the icons and the font file. */
export function buildAssets(font: FontFile): Array<OutputFile> {
  return [
    ...buildLogos(),
    ...buildIcons(),
    { content: readFileSync(font.source), kind: "file", path: `project/${font.target}` },
  ];
}
