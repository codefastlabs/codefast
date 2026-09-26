import { act, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { renderToString } from "react-dom/server";

import {
  Sidebar,
  SidebarContent,
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "#components/sidebar";

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

function Shell({ shortcutKey }: { readonly shortcutKey?: string | false }): ReactNode {
  return (
    <SidebarProvider {...(shortcutKey === undefined ? {} : { shortcutKey })}>
      <Sidebar collapsible="icon">
        <SidebarContent>nav</SidebarContent>
      </Sidebar>
      <SidebarInset>
        <SidebarState />
        <textarea aria-label="Notes" />
        <input aria-label="Title" />
        <div aria-label="Editor" contentEditable suppressContentEditableWarning />
        <button type="button">Plain</button>
      </SidebarInset>
    </SidebarProvider>
  );
}

function sidebarState(): string | null {
  return screen.getByTestId("sidebar-state").getAttribute("data-state");
}

beforeEach(() => {
  stubViewport({ isBelowBreakpoint: false });
});

afterEach(() => {
  document.documentElement.style.removeProperty("--sidebar-breakpoint");
});

describe("sidebar", () => {
  describe("keyboard shortcut", () => {
    test("toggles with ⌘B or Ctrl+B outside a text field", () => {
      render(<Shell />);

      fireEvent.keyDown(screen.getByRole("button", { name: "Plain" }), { key: "b", metaKey: true });
      expect(sidebarState()).toBe("collapsed");

      fireEvent.keyDown(document.body, { ctrlKey: true, key: "B" });
      expect(sidebarState()).toBe("expanded");
    });

    test("leaves the key to a text field, where it edits text", () => {
      render(<Shell />);

      // jsdom does not compute `isContentEditable`, which a browser derives from the attribute.
      Object.defineProperty(screen.getByLabelText("Editor"), "isContentEditable", { value: true });

      for (const label of ["Notes", "Title", "Editor"]) {
        fireEvent.keyDown(screen.getByLabelText(label), { key: "b", metaKey: true });
        expect(sidebarState()).toBe("expanded");
      }
    });

    test("leaves the key to a handler that already took it", () => {
      render(<Shell />);

      // Stands in for an editor that binds ⌘B itself; the element is not editable, so only the handled event stops it.
      const target = screen.getByRole("button", { name: "Plain" });
      target.addEventListener("keydown", (event) => {
        event.preventDefault();
      });
      fireEvent.keyDown(target, { key: "b", metaKey: true });

      expect(sidebarState()).toBe("expanded");
    });

    test("ignores IME composition, auto-repeat, and other modifier chords", () => {
      render(<Shell />);

      const target = screen.getByRole("button", { name: "Plain" });
      const chords = [
        { isComposing: true, key: "b", metaKey: true },
        { key: "b", metaKey: true, repeat: true },
        { key: "b", metaKey: true, shiftKey: true },
        { altKey: true, key: "b", metaKey: true },
        { key: "b" },
      ];

      for (const chord of chords) {
        fireEvent.keyDown(target, chord);
        expect(sidebarState()).toBe("expanded");
      }
    });

    test("uses the key shortcutKey names", () => {
      render(<Shell shortcutKey="j" />);

      const target = screen.getByRole("button", { name: "Plain" });
      fireEvent.keyDown(target, { key: "b", metaKey: true });
      expect(sidebarState()).toBe("expanded");

      fireEvent.keyDown(target, { key: "j", metaKey: true });
      expect(sidebarState()).toBe("collapsed");
    });

    test("lets the first of several providers keep the key on every press", () => {
      render(
        <>
          <SidebarProvider>
            <SidebarState />
          </SidebarProvider>
          <SidebarProvider>
            <SidebarState />
          </SidebarProvider>
        </>,
      );

      const [first, second] = screen.getAllByTestId("sidebar-state");

      fireEvent.keyDown(document.body, { key: "b", metaKey: true });
      expect(first).toHaveAttribute("data-state", "collapsed");
      expect(second).toHaveAttribute("data-state", "expanded");

      fireEvent.keyDown(document.body, { key: "b", metaKey: true });
      expect(first).toHaveAttribute("data-state", "expanded");
      expect(second).toHaveAttribute("data-state", "expanded");
    });

    test("listens for nothing when shortcutKey is false", () => {
      render(<Shell shortcutKey={false} />);

      fireEvent.keyDown(screen.getByRole("button", { name: "Plain" }), { key: "b", metaKey: true });

      expect(sidebarState()).toBe("expanded");
    });
  });

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

  describe("mobile sheet", () => {
    function MobileShell({ mobileTitle }: { readonly mobileTitle?: string }): ReactNode {
      return (
        <SidebarProvider>
          <Sidebar {...(mobileTitle === undefined ? {} : { mobileTitle })}>
            <SidebarContent>nav</SidebarContent>
          </Sidebar>
          <SidebarInset>
            <SidebarTrigger />
          </SidebarInset>
        </SidebarProvider>
      );
    }

    test("names the sheet in English by default, with no filler description", async () => {
      stubViewport({ isBelowBreakpoint: true });
      const user = userEvent.setup();
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
      render(<MobileShell />);

      await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

      const sheet = screen.getByRole("dialog", { name: "Sidebar" });
      expect(sheet).not.toHaveAttribute("aria-describedby");
      expect(warn).not.toHaveBeenCalledWith(expect.stringContaining("Missing `Description`"));
      warn.mockRestore();
    });

    test("takes the sheet's name from mobileTitle", async () => {
      stubViewport({ isBelowBreakpoint: true });
      const user = userEvent.setup();
      render(<MobileShell mobileTitle="Điều hướng" />);

      await user.click(screen.getByRole("button", { name: "Toggle Sidebar" }));

      expect(screen.getByRole("dialog", { name: "Điều hướng" })).toBeInTheDocument();
    });
  });
});
