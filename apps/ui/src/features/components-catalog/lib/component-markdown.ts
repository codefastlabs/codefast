import { anatomyToText } from "#/features/components-catalog/lib/anatomy";
import { INSTALL_COMMAND } from "#/lib/install";
import { absoluteUrl } from "#/lib/seo";
import type { ComponentMeta } from "#/registry/_core/components";
import { COMPONENT_BY_SLUG, componentImportLabel } from "#/registry/_core/components";
import type { ResolvedComponentDoc } from "#/registry/_core/types";

/** Escape a value for use inside a Markdown table cell (pipes break columns). */
function escapeCell(value: string): string {
  return value.replaceAll("|", "\\|").replaceAll("\n", " ");
}

/** Render a GitHub-flavoured Markdown table from a header row and body rows. */
function markdownTable(headers: ReadonlyArray<string>, rows: ReadonlyArray<ReadonlyArray<string>>): string {
  const head = `| ${headers.join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((cells) => `| ${cells.map(escapeCell).join(" | ")} |`);

  return [head, divider, ...body].join("\n");
}

/**
 * Serialise a component's detail page to a single Markdown document — the
 * payload behind the "Copy page" action, written to be pasted straight into an
 * LLM. The metadata header always renders; the rich sections fill in once the
 * component's `doc` chunk has loaded (`loadDoc`).
 */
export function buildComponentMarkdown(component: ComponentMeta, doc?: ResolvedComponentDoc): string {
  const isComposition = component.composition !== undefined;
  const sections: Array<string> = [];

  sections.push(`# ${component.name}`, component.description, `> ${absoluteUrl(`/components/${component.slug}`)}`);

  sections.push("## Installation", `\`\`\`bash\n${INSTALL_COMMAND}\n\`\`\``);

  sections.push(
    isComposition ? "## Composed from" : "## Import",
    isComposition ? componentImportLabel(component) : `\`${componentImportLabel(component)}\``,
  );

  if (doc?.usage) {
    sections.push("## Usage", `\`\`\`tsx\n${doc.usage.code}\n\`\`\``);
  }

  if (doc?.examples.length) {
    const examples = doc.examples.map((example) => {
      const parts = [`### ${example.title}`];

      if (example.description) {
        parts.push(example.description);
      }

      parts.push(`\`\`\`tsx\n${example.code}\n\`\`\``);

      return parts.join("\n\n");
    });

    sections.push("## Examples", examples.join("\n\n"));
  }

  if (doc?.anatomy?.length) {
    sections.push("## Anatomy", `\`\`\`\n${anatomyToText(doc.anatomy)}\n\`\`\``);
  }

  if (doc?.features?.length) {
    sections.push("## Features", doc.features.map((feature) => `- ${feature}`).join("\n"));
  }

  if (doc?.api?.length) {
    const groups = doc.api.map((group) => {
      const parts = [`### ${group.name}`];

      if (group.description) {
        parts.push(group.description);
      }

      parts.push(
        markdownTable(
          ["Prop", "Type", "Default", "Description"],
          group.props.map((prop) => [
            `\`${prop.name}\``,
            `\`${prop.type}\``,
            prop.default ? `\`${prop.default}\`` : "—",
            prop.description,
          ]),
        ),
      );

      return parts.join("\n\n");
    });

    sections.push("## API reference", groups.join("\n\n"));
  }

  if (doc?.accessibility) {
    const parts: Array<string> = ["## Accessibility"];

    if (doc.accessibility.keyboard?.length) {
      parts.push(
        markdownTable(
          ["Keys", "Description"],
          doc.accessibility.keyboard.map((row) => [row.keys.join(" + "), row.description]),
        ),
      );
    }

    if (doc.accessibility.notes?.length) {
      parts.push(
        doc.accessibility.notes
          .map((note) => (typeof note === "string" ? `- ${note}` : `- **${note.title}:** ${note.description}`))
          .join("\n"),
      );
    }

    sections.push(parts.join("\n\n"));
  }

  if (doc?.guidelines) {
    const parts: Array<string> = ["## Guidelines"];

    if (doc.guidelines.do?.length) {
      parts.push("### Do", doc.guidelines.do.map((item) => `- ${item}`).join("\n"));
    }

    if (doc.guidelines.dont?.length) {
      parts.push("### Don't", doc.guidelines.dont.map((item) => `- ${item}`).join("\n"));
    }

    sections.push(parts.join("\n\n"));
  }

  if (doc?.dependencies?.length || doc?.related?.length) {
    const parts: Array<string> = ["## Related"];

    if (doc.dependencies?.length) {
      parts.push("### Dependencies", doc.dependencies.map((dependency) => `- ${dependency}`).join("\n"));
    }

    if (doc.related?.length) {
      const links = doc.related.map((slug) => {
        const related = COMPONENT_BY_SLUG.get(slug);

        return `- [${related?.name ?? slug}](${absoluteUrl(`/components/${slug}`)})`;
      });

      parts.push("### See also", links.join("\n"));
    }

    sections.push(parts.join("\n\n"));
  }

  return `${sections.join("\n\n")}\n`;
}
