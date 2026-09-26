import { act, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import { Sidebar, SidebarContent, SidebarInset, SidebarProvider, useSidebar } from "#components/sidebar";

// A viewport the provider's media query reads: `matches` answers every query at once, which is all it asks.
function stubViewport(options: { readonly isBelowBreakpoint: boolean }): { readonly queries: Array<string> } {
  const queries: Array<string> = [];

  Object.defineProperty(window, "matchMedia", {
    configurable: true,
    value: (query: string) => {
      queries.push(query);

      return {
        addEventListener: () => {},
        matches: options.isBelowBreakpoint,
        media: query,
        removeEventListener: () => {},
      };
    },
    writable: true,
  });

  return { queries };
}

function SidebarState(): ReactNode {
  const { isMobile, state } = useSidebar("SidebarState");

  return <output data-mobile={isMobile ? "true" : "false"} data-state={state} data-testid="sidebar-state" />;
}

function Shell(): ReactNode {
  return (
    <SidebarProvider>
      <Sidebar collapsible="icon">
        <SidebarContent>nav</SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarState />
      </SidebarInset>
    </SidebarProvider>
  );
}

beforeEach(() => {
  stubViewport({ isBelowBreakpoint: false });
});

afterEach(() => {
  document.documentElement.style.removeProperty("--sidebar-breakpoint");
});

describe("sidebar", () => {
  describe("breakpoint", () => {
    test("matches the preset's default breakpoint when the page defines none", () => {
      const { queries } = stubViewport({ isBelowBreakpoint: false });

      render(<Shell />);

      expect(queries).toContain("(width < 48rem)");
    });

    test("matches the breakpoint the stylesheet resolved", () => {
      document.documentElement.style.setProperty("--sidebar-breakpoint", "40rem");
      const { queries } = stubViewport({ isBelowBreakpoint: false });

      render(<Shell />);

      expect(queries).toContain("(width < 40rem)");
      expect(queries).not.toContain("(width < 48rem)");
    });

    test("switches to the sheet below the breakpoint", () => {
      stubViewport({ isBelowBreakpoint: true });

      const { container } = render(<Shell />);

      expect(screen.getByTestId("sidebar-state")).toHaveAttribute("data-mobile", "true");
      expect(container.querySelector('[data-slot="sidebar-container"]')).toBeNull();
    });

    test("hydrates a phone without a mismatch, then switches to the sheet", async () => {
      const container = document.createElement("div");
      container.innerHTML = renderToString(<Shell />);
      document.body.append(container);
      stubViewport({ isBelowBreakpoint: true });
      const onRecoverableError = vi.fn();

      await act(async () => {
        render(<Shell />, { container, hydrate: true, onRecoverableError });
        await Promise.resolve();
      });

      expect(onRecoverableError).not.toHaveBeenCalled();
      expect(screen.getByTestId("sidebar-state")).toHaveAttribute("data-mobile", "true");
      container.remove();
    });
  });
});
