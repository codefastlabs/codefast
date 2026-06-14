import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CodeBlock } from "#/components/shared/code-block";

afterEach(() => {
  cleanup();
});

describe("CodeBlock", () => {
  it("injects the pre-highlighted HTML", () => {
    render(<CodeBlock code={`const a = 1;`} highlightedCode={`<pre class="shiki"><code>const a = 1;</code></pre>`} />);

    expect(screen.getByText("const a = 1;")).toBeTruthy();
  });

  it("renders a copy control", () => {
    render(<CodeBlock code="x" highlightedCode="<pre class='shiki'>x</pre>" />);

    expect(screen.getByRole("button", { name: /copy code/i })).toBeTruthy();
  });
});
