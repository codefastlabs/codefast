import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CopyButton } from "#/components/shared/copy-button";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

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

describe("CopyButton", () => {
  it("renders a copy control", () => {
    render(<CopyButton value="const a = 1;" />);

    expect(screen.getByRole("button", { name: /copy/i })).toBeTruthy();
  });

  it("forwards positioning classes", () => {
    render(<CopyButton value="x" className="absolute top-3" />);

    const button = screen.getByRole("button", { name: /copy/i });

    expect(button.className).toContain("absolute");
    expect(button.className).toContain("top-3");
  });

  it("tracks copy_code with the given kind/name on a successful copy", async () => {
    const user = userEvent.setup();

    render(<CopyButton value="pnpm add @codefast/ui" analyticsKind="install-command" analyticsName="home-hero" />);

    await user.click(screen.getByRole("button", { name: /copy/i }));

    expect(track).toHaveBeenCalledWith("copy_code", { kind: "install-command", name: "home-hero" });
  });

  it("does not track when analyticsKind/analyticsName are omitted", async () => {
    const user = userEvent.setup();

    render(<CopyButton value="pnpm add @codefast/ui" />);

    await user.click(screen.getByRole("button", { name: /copy/i }));

    expect(track).not.toHaveBeenCalled();
  });
});
