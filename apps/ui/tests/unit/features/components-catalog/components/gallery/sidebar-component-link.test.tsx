import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ComponentProps, ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarComponentLink } from "#/features/components-catalog/components/gallery/sidebar-component-link";

const { track } = vi.hoisted(() => ({ track: vi.fn() }));

vi.mock("#/features/tracking/lib/tracking", () => ({ track }));

vi.mock(import("@tanstack/react-router"), async (importOriginal) => {
  const actual = await importOriginal();

  function MockLink({
    children,
    onClick,
    to,
  }: {
    readonly children?: ReactNode;
    readonly onClick?: ComponentProps<"a">["onClick"];
    readonly to?: string;
  }) {
    return (
      <a href={to ?? "#"} onClick={onClick}>
        {children}
      </a>
    );
  }

  return {
    ...actual,
    Link: MockLink as typeof actual.Link,
  };
});

beforeEach(() => {
  track.mockClear();
});

afterEach(() => {
  cleanup();
});

describe("SidebarComponentLink tracking", () => {
  it("tracks select_component on click", async () => {
    const user = userEvent.setup();

    render(<SidebarComponentLink slug="button" name="Button" surface="gallery-sidebar" />);

    await user.click(screen.getByRole("link", { name: /^Button$/i }));

    expect(track).toHaveBeenCalledWith("select_component", {
      slug: "button",
      surface: "gallery-sidebar",
    });
  });
});
