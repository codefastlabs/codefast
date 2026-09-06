import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { ScopesCard } from "#/features/home/components/scopes-card";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

beforeEach(() => {
  track.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("ScopesCard", () => {
  it("opens on the shop as shipped, with validate() passing", () => {
    render(<ScopesCard />);

    expect(screen.getByRole("status")).toHaveTextContent("validate() passed");
    expect(screen.getByText(/to\(OrderService\)\.transient\(\)/)).toBeInTheDocument();
  });

  it("shows the captive singleton validate() refuses on demand, and back", async () => {
    const user = userEvent.setup();

    render(<ScopesCard />);

    await user.click(screen.getByRole("button", { name: "Make OrderService a singleton" }));

    expect(screen.getByRole("status")).toHaveTextContent(/validate\(\) refused: Scope violation/);
    expect(screen.getByText(/to\(OrderService\)\.singleton\(\)/)).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith("run_demo", { demo: "scopes", action: "toggle-scope", trigger: "click" });

    await user.click(screen.getByRole("button", { name: "Make OrderService transient again" }));

    expect(screen.getByRole("status")).toHaveTextContent("validate() passed");
  });
});
