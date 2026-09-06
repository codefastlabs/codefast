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
  it("opens on the sound graph, with validate() passing", () => {
    render(<ScopesCard />);

    expect(screen.getByRole("status")).toHaveTextContent("validate() passed");
    expect(screen.getByText(/to\(ResponseCache\)\.scoped\(\)/)).toBeInTheDocument();
  });

  it("shows the captive singleton validate() refuses on demand, and back", async () => {
    const user = userEvent.setup();

    render(<ScopesCard />);

    await user.click(screen.getByRole("button", { name: "Make the cache a singleton" }));

    expect(screen.getByRole("status")).toHaveTextContent(/validate\(\) refused: Scope violation/);
    expect(screen.getByText(/to\(ResponseCache\)\.singleton\(\)/)).toBeInTheDocument();
    expect(track).toHaveBeenCalledWith("run_demo", { demo: "scopes", action: "toggle-scope", trigger: "click" });

    await user.click(screen.getByRole("button", { name: "Make the cache scoped again" }));

    expect(screen.getByRole("status")).toHaveTextContent("validate() passed");
  });
});
