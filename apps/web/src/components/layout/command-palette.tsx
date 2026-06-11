import { Button } from "@codefast/ui/button";
import {
  Command,
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@codefast/ui/command";
import { Kbd } from "@codefast/ui/kbd";
import { useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import { useCallback, useEffect, useState } from "react";

import { COMPONENTS } from "#/components/examples/meta";

const PAGES = [
  { to: "/", label: "Home" },
  { to: "/components", label: "Components" },
  { to: "/about", label: "Getting Started" },
] as const;

/**
 * Global ⌘K / Ctrl+K command palette. Renders its own trigger (a search field
 * on desktop, an icon button on mobile) plus the dialog, and reads the
 * lightweight component registry so it never pulls the heavy demo bundle.
 */
export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  // ⌘K (mac) / Ctrl+K (others) toggles the palette from anywhere.
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent): void {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen((value) => !value);
      }
    }

    document.addEventListener("keydown", onKeyDown);

    return () => {
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  const goToPage = useCallback(
    (to: (typeof PAGES)[number]["to"]) => {
      setOpen(false);
      void navigate({ to });
    },
    [navigate],
  );

  const goToComponent = useCallback(
    (slug: string, hasDemo: boolean, category: string) => {
      setOpen(false);

      if (hasDemo) {
        // Components with a demo have a dedicated detail page.
        void navigate({ to: "/components/$slug", params: { slug } });
      } else {
        // Sidebar (no demo) jumps to its section on the overview.
        void navigate({ to: "/components", hash: category });
      }
    },
    [navigate],
  );

  return (
    <>
      <Button
        onClick={() => {
          setOpen(true);
        }}
        aria-label="Search components"
        variant="secondary"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="hidden flex-1 text-left text-sm lg:inline">Search components…</span>
        <Kbd className="hidden lg:inline-flex">⌘K</Kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={setOpen}>
        <Command>
          <CommandInput placeholder="Search components and pages…" />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {PAGES.map((page) => (
                <CommandItem
                  key={page.to}
                  value={`page ${page.label}`}
                  onSelect={() => {
                    goToPage(page.to);
                  }}
                >
                  {page.label}
                </CommandItem>
              ))}
            </CommandGroup>
            <CommandGroup heading="Components">
              {COMPONENTS.map((component) => (
                <CommandItem
                  key={component.slug}
                  value={`${component.name} ${component.category}`}
                  onSelect={() => {
                    goToComponent(component.slug, component.hasDemo, component.category);
                  }}
                >
                  <span className="grow">{component.name}</span>
                  <span className="ml-auto text-xs text-ui-muted capitalize" data-slot="command-shortcut">
                    {component.category}
                  </span>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </CommandDialog>
    </>
  );
}
