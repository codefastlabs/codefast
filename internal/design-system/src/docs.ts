import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { NAMESPACE } from "#config";
import type { OutputFile } from "#output";
import { REGISTRY_ROOT, UI_ROOT } from "#paths";
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
  for (const [, part = "", body = ""] of declarations.matchAll(/(?:interface|type) (\w+)Props[^{]*\{([^}]*)\}/g)) {
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

/** Writes each card's guidelines from the registry's description, the variants, the declarations and the demo. */
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

/** Concatenates the declarations of every component, variant and the class helpers into one reference file. */
export function buildDeclarations(): OutputFile {
  const dist = join(UI_ROOT, "dist");
  const files = [
    ...readdirSync(join(dist, "components")).map((file) => `components/${file}`),
    ...readdirSync(join(dist, "variants")).map((file) => `variants/${file}`),
    "lib/utils.d.ts",
  ].filter((file) => file.endsWith(".d.ts"));
  const body = files
    .sort()
    .map(
      (file) =>
        `// ── ${file} ──\n${readFileSync(join(dist, file), "utf8")
          .split("\n")
          .filter((line) => !/^import |sourceMappingURL/.test(line))
          .join("\n")}`,
    )
    .join("\n");
  return {
    content: `/* Codefast UI — declarations of @codefast/ui's components and variants, concatenated from its build (documentation; imports stripped). Runtime: window.${NAMESPACE}. */\n\n${body}`,
    contentType: "text/plain",
    kind: "file",
    path: "project/components/index.d.ts",
  };
}
