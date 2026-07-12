import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CopyPageMenu } from "#/features/components-catalog/components/detail/copy-page-menu";
import type { ComponentMeta } from "#/registry/_core/components";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

vi.mock("#/registry/_core/docs", () => ({
  loadDoc: vi.fn().mockResolvedValue(undefined),
}));

const component = {
  slug: "button",
  name: "Button",
  category: "form",
  description: "Triggers an action.",
  hasDemo: true,
  isNew: false,
} satisfies ComponentMeta;

beforeEach(() => {
  track.mockClear();
  Object.defineProperty(navigator, "clipboard", {
    configurable: true,
    value: { writeText: vi.fn().mockResolvedValue(undefined) },
  });
});

afterEach(() => {
  cleanup();
});

describe("CopyPageMenu tracking", () => {
  it("tracks copy_page on a successful primary copy without sending markdown", async () => {
    const user = userEvent.setup();

    render(<CopyPageMenu component={component} />);

    await user.click(screen.getByRole("button", { name: /^copy page$/i }));

    await waitFor(() => {
      expect(track).toHaveBeenCalledWith("copy_page", { slug: "button", variant: "markdown" });
    });

    const payload = track.mock.calls.find(([name]) => name === "copy_page")?.[1] as Record<string, unknown>;

    expect(payload).not.toHaveProperty("markdown");
  });

  it("tracks open_external when opening ChatGPT", async () => {
    const user = userEvent.setup();

    render(<CopyPageMenu component={component} />);

    await user.click(screen.getByRole("button", { name: /more copy options/i }));
    await user.click(screen.getByRole("menuitem", { name: /open in chatgpt/i }));

    expect(track).toHaveBeenCalledWith("open_external", {
      destination: "chatgpt",
      surface: "copy-page-menu",
      slug: "button",
    });
  });
});
