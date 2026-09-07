import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CodeBlock } from "#/components/shared/code-block";

afterEach(() => {
  cleanup();
});

describe("CodeBlock", () => {
  it("injects the pre-highlighted HTML", () => {
    render(<CodeBlock highlightedCode={`<pre class="shiki"><code>const a = 1;</code></pre>`} />);

    expect(screen.getByText("const a = 1;")).toBeTruthy();
  });

  it("renders a single dual-theme surface (no light/dark duplication)", () => {
    const { container } = render(<CodeBlock highlightedCode={`<pre class="shiki"><code>const a = 1;</code></pre>`} />);

    expect(container.querySelectorAll(".shiki")).toHaveLength(1);
  });
});
