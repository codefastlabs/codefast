import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { NAMESPACE } from "#config";
import type { OutputFile } from "#output";
import { REGISTRY_ROOT, THEME_ROOT, UI_ROOT } from "#paths";
import type { ComponentCard } from "#registry";

interface VariantKey {
  defaultValue: string | undefined;
  name: string;
  options: Array<string>;
}

/** Reads the option keys of every `tv()` variant function, keyed by the function's name without `Variants`. */
function readVariants(): Map<string, Array<VariantKey>> {
  const variants = new Map<string, Array<VariantKey>>();
  const directory = join(UI_ROOT, "src/variants");
  for (const file of readdirSync(directory)) {
    const source = readFileSync(join(directory, file), "utf8");
    for (const match of source.matchAll(/const (\w+)Variants = tv\(/g)) {
      const rest = source.slice(match.index);
      const opening = rest.indexOf("{", rest.indexOf("variants: {"));
      if (rest.indexOf("variants: {") === -1) {
        continue;
      }
      let depth = 0;
      let closing = opening;
      for (; closing < rest.length; closing++) {
        if (rest[closing] === "{") {
          depth++;
        } else if (rest[closing] === "}" && --depth === 0) {
          break;
        }
      }
      const keys: Array<VariantKey> = [];
      let level = 0;
      for (const line of rest.slice(opening + 1, closing).split("\n")) {
        const text = line.trim();
        const key = /^"?([\w-]+)"?:\s*\{/.exec(text)?.[1];
        const option = /^"?([\w-]+)"?:(\s|$)/.exec(text)?.[1];
        if (key && level === 0) {
          keys.push({ defaultValue: undefined, name: key, options: [] });
        } else if (option && level === 1) {
          keys.at(-1)?.options.push(option);
        }
        level += (line.match(/\{/g) ?? []).length - (line.match(/\}/g) ?? []).length;
      }
      const defaults = /defaultVariants:\s*\{([^}]*)\}/.exec(rest.slice(0, closing + 400))?.[1] ?? "";
      for (const [, name, value] of defaults.matchAll(/"?([\w-]+)"?:\s*"([^"]+)"/g)) {
        const key = keys.find((candidate) => candidate.name === name);
        if (key) {
          key.defaultValue = value;
        }
      }
      variants.set(
        (match[1] ?? "").toLowerCase(),
        keys.filter((key) => key.options.length > 0),
      );
    }
  }
  return variants;
}

function optionLines(card: ComponentCard, variants: Map<string, Array<VariantKey>>): Array<string> {
  const lines: Array<string> = [];
  const code = (value: string) => `\`${value}\``;
  for (const part of card.parts) {
    for (const key of variants.get(part.toLowerCase()) ?? []) {
      lines.push(
        `- ${code(part)} · ${code(key.name)}: ${key.options.map(code).join(", ")}${key.defaultValue ? ` — default ${code(key.defaultValue)}` : ""}`,
      );
    }
  }
  const declarations = readFileSync(join(UI_ROOT, `dist/components/${card.slug}.d.ts`), "utf8");
  // `[^{;]` stops at a body-less alias, so it never claims the next declaration's members.
  for (const [, part = "", body = ""] of declarations.matchAll(/(?:interface|type) (\w+)Props[^{;]*\{([^}]*)\}/g)) {
    if (!card.parts.includes(part)) {
      continue;
    }
    for (const [, name = "", union = ""] of body.matchAll(/^\s*(\w+)\?:\s*("[^"]+"(?:\s*\|\s*"[^"]+")*);/gm)) {
      if (!lines.some((line) => line.startsWith(`- ${code(part)} · ${code(name)}:`))) {
        lines.push(
          `- ${code(part)} · ${code(name)}: ${union
            .split("|")
            .map((value) => code(value.trim().replaceAll('"', "")))
            .join(", ")}`,
        );
      }
    }
  }
  return lines;
}

/**
 * Writes each card's guidelines from the registry's description, the variants, the declarations and the demo.
 *
 * @since 0.1.0
 */
export function buildComponentDocs(cards: Array<ComponentCard>): Array<OutputFile> {
  const variants = readVariants();
  return cards.map((card) => {
    const options = optionLines(card, variants);
    const examples = card.examples.map(
      (example) =>
        `- **${example.title}**${example.description ? ` — ${example.description.replace(/<([A-Z][\w.]*)([^>]*)\/>/g, "`<$1$2/>`")}` : ""}`,
    );
    const shown = card.picks.map((pick) => `\`${pick.stem}\``).join(" and ");
    const demo = readFileSync(join(REGISTRY_ROOT, card.slug, "demo.tsx"), "utf8").trim();
    const sections = [
      `# ${card.name}`,
      card.summary,
      `Import from \`@codefast/ui/${card.slug}\`. In this system's bundle every part is on \`window.${NAMESPACE}\`.`,
      `## Parts\n\n${card.parts.map((part) => `\`${part}\``).join(" · ")}`,
      ...(options.length > 0 ? [`## Options\n\n${options.join("\n")}`] : []),
      ...(examples.length > 0 ? [`## Examples\n\n${examples.join("\n")}`] : []),
      `## Usage\n\nThe preview renders this demo from the codefastlabs.com registry${shown ? `, followed by its ${shown} example${card.picks.length > 1 ? "s" : ""}` : ""}:\n\n\`\`\`tsx\n${demo}\n\`\`\``,
    ];
    return { content: `${sections.join("\n\n")}\n`, kind: "file", path: `project/components/${card.name}/README.md` };
  });
}

/** The published declaration files whose exports the bundle puts on the runtime global. */
const RUNTIME_DECLARATIONS = /^\.\/dist\/(?:(?:components|hooks|variants)\/[\w-]+|lib\/utils)\.d\.ts$/;

/** Lists each published `@codefast/ui` subpath the runtime carries, with its declaration file. */
function runtimeSubpaths(): Array<{ specifier: string; types: string }> {
  const manifest: unknown = JSON.parse(readFileSync(join(UI_ROOT, "package.json"), "utf8"));
  const exports =
    typeof manifest === "object" &&
    manifest !== null &&
    "exports" in manifest &&
    typeof manifest.exports === "object" &&
    manifest.exports !== null
      ? manifest.exports
      : {};
  return Object.entries(exports).flatMap(([subpath, target]: [string, unknown]) => {
    const types =
      typeof target === "object" && target !== null && "types" in target && typeof target.types === "string"
        ? target.types
        : "";
    return RUNTIME_DECLARATIONS.test(types) ? [{ specifier: `@codefast/ui${subpath.slice(1)}`, types }] : [];
  });
}

/** The `@codefast/theme` declaration files its root re-exports, which the runtime carries beside the components. */
function themeDeclarations(): Array<{ specifier: string; types: string }> {
  const index = readFileSync(join(THEME_ROOT, "dist/index.d.ts"), "utf8");
  const modules = [...new Set([...index.matchAll(/from "#([\w-]+)"/g)].map(([, name = ""]) => name))];
  return modules.map((name) => ({
    specifier: `@codefast/theme (${name})`,
    types: join(THEME_ROOT, `dist/${name}.d.ts`),
  }));
}

/**
 * Concatenates the declarations of every published component, hook, variant and class helper into one reference file.
 *
 * @since 0.1.0
 */
export function buildDeclarations(): OutputFile {
  const subpaths = runtimeSubpaths()
    .sort((left, right) => left.types.localeCompare(right.types))
    .map(({ specifier, types }) => ({ specifier, types: join(UI_ROOT, types) }));
  const body = [...subpaths, ...themeDeclarations()]
    .map(
      ({ specifier, types }) =>
        `// ── ${specifier} ──\n${readFileSync(types, "utf8")
          .split("\n")
          .filter((line) => !/^import |sourceMappingURL/.test(line))
          .join("\n")}`,
    )
    .join("\n");
  return {
    content: `/* Codefast UI — declarations of @codefast/ui's components, hooks and variants, and of @codefast/theme's appearance API, concatenated from their builds (documentation; imports stripped). Runtime: window.${NAMESPACE}. */\n\n${body}`,
    contentType: "text/plain",
    kind: "file",
    path: "project/components/index.d.ts",
  };
}
