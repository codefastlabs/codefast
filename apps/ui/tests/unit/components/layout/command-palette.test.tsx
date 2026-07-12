import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "#/components/layout/command-palette";

const { track, navigate } = vi.hoisted(() => ({
  track: vi.fn(),
  navigate: vi.fn(),
}));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

vi.mock(import("@tanstack/react-router"), async (importOriginal) => ({
  ...(await importOriginal()),
  useNavigate: () => navigate,
}));

beforeEach(() => {
  track.mockClear();
  navigate.mockClear();

  // cmdk's list measures/scrolls selection; jsdom lacks both APIs.
  vi.stubGlobal(
    "ResizeObserver",
    class {
      observe(): void {}
      unobserve(): void {}
      disconnect(): void {}
    },
  );
  Element.prototype.scrollIntoView = vi.fn();
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe("CommandPalette tracking", () => {
  it("tracks search_query with metadata only (no free-form query text)", async () => {
    const user = userEvent.setup();

    render(<CommandPalette />);

    await user.click(screen.getByRole("button", { name: /search components/i }));
    await user.type(screen.getByPlaceholderText(/search components and pages/i), "butt");

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("search_query", { queryLength: 4 });
    });

    const payload = track.mock.calls.find(([name]) => name === "search_query")?.[1] as Record<string, unknown>;

    expect(payload).not.toHaveProperty("query");
  });

  it("tracks select_search_result when choosing a page", async () => {
    const user = userEvent.setup();

    render(<CommandPalette />);

    await user.click(screen.getByRole("button", { name: /search components/i }));
    await user.click(screen.getByRole("option", { name: /^Components$/i }));

    expect(track).toHaveBeenCalledWith("select_search_result", {
      resultType: "page",
      destination: "/components",
      hadQuery: false,
    });
  });

  it("tracks select_search_result when choosing a component", async () => {
    const user = userEvent.setup();

    render(<CommandPalette />);

    await user.click(screen.getByRole("button", { name: /search components/i }));
    await user.type(screen.getByPlaceholderText(/search components and pages/i), "button form");

    const buttonOption = screen.getByRole("option", {
      name: (_accessibleName, element) => element.getAttribute("data-value") === "Button form",
    });

    await user.click(buttonOption);

    expect(track).toHaveBeenCalledWith(
      "select_search_result",
      expect.objectContaining({
        resultType: "component",
        slug: "button",
        hadQuery: true,
        hasDemo: true,
      }),
    );
  });
});
