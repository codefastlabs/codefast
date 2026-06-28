import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CodeBlock } from "#/components/shared/code-block";

afterEach(() => {
  cleanup();
});

describe("CodeBlock", () => {
  it("injects the pre-highlighted HTML", () => {
    render(<CodeBlock highlightedCodeDark={`<pre class="shiki"><code>const a = 1;</code></pre>`} />);

    expect(screen.getByText("const a = 1;")).toBeTruthy();
  });

  it("renders both light and dark surfaces when both are provided", () => {
    render(
      <CodeBlock
        highlightedCodeDark={`<pre class="shiki"><code>dark</code></pre>`}
        highlightedCodeLight={`<pre class="shiki"><code>light</code></pre>`}
      />,
    );

    expect(screen.getByText("dark")).toBeTruthy();
    expect(screen.getByText("light")).toBeTruthy();
  });
});
