import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { GitHubLink } from "#/components/layout/github-link";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

beforeEach(() => {
  track.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("GitHubLink tracking", () => {
  it("tracks open_external on click", async () => {
    const user = userEvent.setup();

    render(<GitHubLink />);

    await user.click(screen.getByRole("link", { name: /github repository/i }));

    expect(track).toHaveBeenCalledWith("open_external", {
      destination: "github",
      surface: "header",
    });
  });
});
