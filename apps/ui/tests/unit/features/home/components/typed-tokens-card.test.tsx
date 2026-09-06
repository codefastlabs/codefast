import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { TypedTokensCard } from "#/features/home/components/typed-tokens-card";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

const RIGHT = `<pre class="shiki"><code>@injectable([LoggerToken])</code></pre>`;
const WRONG = `<pre class="shiki"><code>@injectable([ShopConfigToken])</code></pre>`;

beforeEach(() => {
  track.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("TypedTokensCard", () => {
  it("opens on the well-declared class and a passing compile", () => {
    render(<TypedTokensCard rightListHtml={RIGHT} wrongListHtml={WRONG} />);

    expect(screen.getByText("@injectable([LoggerToken])")).toBeInTheDocument();
    expect(screen.queryByText("@injectable([ShopConfigToken])")).not.toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0 errors");
  });

  it("swaps in the wrong token and the compiler's cause on demand, and back", async () => {
    const user = userEvent.setup();

    render(<TypedTokensCard rightListHtml={RIGHT} wrongListHtml={WRONG} />);

    await user.click(screen.getByRole("button", { name: "Name the wrong token" }));

    expect(screen.getByText("@injectable([ShopConfigToken])")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("Property 'info' is missing in type 'ShopConfig'");
    expect(track).toHaveBeenCalledWith("run_demo", { demo: "typed-tokens", action: "toggle-token", trigger: "click" });

    await user.click(screen.getByRole("button", { name: "Name the right token again" }));

    expect(screen.getByText("@injectable([LoggerToken])")).toBeInTheDocument();
    expect(screen.getByRole("status")).toHaveTextContent("0 errors");
  });
});
