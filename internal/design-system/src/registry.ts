import { existsSync, readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { CARD_GROUPS, CARD_NAMES, CARDLESS, DEMO_ONLY, EXAMPLE_PRIORITY, SUMMARY_OVERRIDES } from "#config";
import { REGISTRY_ROOT, UI_ROOT } from "#paths";

/** A registry example: its title, description and the `<stem>.example.tsx` it lives in. */
interface RegistryExample {
  description: string | undefined;
  stem: string;
  title: string;
}

/** One component card: the `@codefast/ui` file it documents and the registry material that shows it. */
export interface ComponentCard {
  category: string;
  examples: Array<RegistryExample>;
  group: string;
  name: string;
  parts: Array<string>;
  picks: Array<RegistryExample>;
  slug: string;
  summary: string;
}

function valueExports(source: string): Array<string> {
  return [...source.matchAll(/^export\s*\{([^}]*)\}/gm)].flatMap((match) =>
    (match[1] ?? "")
      .split(",")
      .map((part) => part.trim())
      .filter(Boolean),
  );
}

function readExamples(slug: string): Array<RegistryExample> {
  const doc = join(REGISTRY_ROOT, slug, "doc.ts");
  if (!existsSync(doc)) {
    return [];
  }
  return [
    ...readFileSync(doc, "utf8").matchAll(
      /title:\s*"([^"]*)",\s*(?:description:\s*"([^"]*)",)?[\s\S]*?docSource\(\s*"[^"]+",\s*"([^"]+)"\s*\)/g,
    ),
  ].map((match) => ({ description: match[2], stem: match[3] ?? "", title: match[1] ?? "" }));
}

/** Lists a card for every `@codefast/ui` component file the registry demonstrates. */
export function discoverCards(): Array<ComponentCard> {
  const components = join(UI_ROOT, "src/components");
  return readdirSync(components)
    .filter((file) => file.endsWith(".tsx"))
    .sort()
    .map((file) => file.replace(/\.tsx$/, ""))
    .filter((slug) => {
      if (CARDLESS.has(slug)) {
        return false;
      }
      if (!existsSync(join(REGISTRY_ROOT, slug, "demo.tsx"))) {
        throw new Error(`The registry has no demo for ${slug}; add one or list it in CARDLESS`);
      }
      return true;
    })
    .map((slug) => {
      const meta = readFileSync(join(REGISTRY_ROOT, slug, "meta.ts"), "utf8");
      const category = /category:\s*"(\w+)"/.exec(meta)?.[1] ?? "";
      const group = CARD_GROUPS[category];
      const description = /description:\s*"([^"]+)"/.exec(meta)?.[1];
      if (!group || !description) {
        throw new Error(`registry/${slug}/meta.ts has no known category or no description`);
      }
      const parts = valueExports(readFileSync(join(components, `${slug}.tsx`), "utf8"));
      const pascal = slug.replace(/(^|-)(\w)/g, (_match, _dash, letter: string) => letter.toUpperCase());
      const examples = readExamples(slug).filter((example) => example.stem !== "rtl");
      const picks =
        category === "overlay" || DEMO_ONLY.has(slug)
          ? []
          : EXAMPLE_PRIORITY.flatMap((stem) => examples.filter((example) => example.stem === stem)).slice(0, 2);
      return {
        category,
        examples,
        group,
        name: CARD_NAMES[slug] ?? parts.find((part) => part.toLowerCase() === pascal.toLowerCase()) ?? pascal,
        parts,
        picks,
        slug,
        summary: SUMMARY_OVERRIDES[slug] ?? description,
      };
    });
}
