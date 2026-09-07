import { describe, expect, it } from "vitest";

import { renderMarkdown } from "#/features/package-docs/lib/markdown/render.impl";

const context = { pkg: "di", file: "README.md" };

describe("renderMarkdown", () => {
  it("returns the title, GitHub-style heading ids, and a two-level TOC", async () => {
    const rendered = await renderMarkdown(
      ["# `@codefast/di`", "", "## Install", "", "text", "", "### With pnpm", "", "## Install", "", "#### Deep"].join(
        "\n",
      ),
      context,
    );

    expect(rendered.title).toBe("@codefast/di");
    expect(rendered.html).not.toContain("<h1");
    expect(rendered.html).toContain('<h2 id="install">');
    expect(rendered.html).toContain('<h2 id="install-1">');
    expect(rendered.toc).toEqual([
      { id: "install", label: "Install", depth: 1 },
      { id: "with-pnpm", label: "With pnpm", depth: 2 },
      { id: "install-1", label: "Install", depth: 1 },
    ]);
  });

  it("rewrites repo links and marks external ones", async () => {
    const rendered = await renderMarkdown(
      "See [the spec](./SPEC.md#goals) and [Radix](https://radix-ui.com).",
      context,
    );

    expect(rendered.html).toContain('href="/docs/di/spec#goals"');
    expect(rendered.html).toContain('href="https://radix-ui.com" rel="noreferrer"');
  });

  it("highlights known fences with Shiki and leaves unknown ones as plain code", async () => {
    const rendered = await renderMarkdown(
      ["```ts", "const a: number = 1;", "```", "", "```text", "plain body", "```"].join("\n"),
      context,
    );

    expect(rendered.html).toContain('class="shiki');
    expect(rendered.html).toContain("--shiki-dark");
    expect(rendered.html).toContain('<pre class="shiki"><code>plain body');
    expect(rendered.html.match(/data-copy-code/g)).toHaveLength(2);
  });

  it("renders a mermaid fence as a diagram source block with no copy button", async () => {
    const rendered = await renderMarkdown(["```mermaid", "graph TD;", "```"].join("\n"), context);

    expect(rendered.html).toContain('<pre class="mermaid">graph TD;');
    expect(rendered.html).not.toContain("markdown-code");
    expect(rendered.html).not.toContain("data-copy-code");
  });

  it("keeps explicit anchor targets and tables", async () => {
    const rendered = await renderMarkdown(
      ['<a id="custom"></a>', "", "| a | b |", "| - | - |", "| 1 | 2 |"].join("\n"),
      context,
    );

    expect(rendered.html).toContain('<a id="custom"></a>');
    expect(rendered.html).toContain("<table>");
  });
});
