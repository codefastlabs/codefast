import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { CopyButton } from "#/components/shared/copy-button";

afterEach(() => {
  cleanup();
});

describe("CopyButton", () => {
  it("renders a copy control", () => {
    render(<CopyButton value="const a = 1;" />);

    expect(screen.getByRole("button", { name: /copy code/i })).toBeTruthy();
  });

  it("forwards positioning classes", () => {
    render(<CopyButton value="x" className="absolute top-3" />);

    const button = screen.getByRole("button", { name: /copy code/i });

    expect(button.className).toContain("absolute");
    expect(button.className).toContain("top-3");
  });
});
