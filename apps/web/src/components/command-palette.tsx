import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { SearchIcon } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@codefast/ui/command";
import { ALL_COMPONENTS } from "#/data/components";

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
      <button
        type="button"
        onClick={() => {
          setOpen(true);
        }}
        aria-label="Search components"
        className="flex items-center gap-2 rounded-lg border border-border bg-muted px-2 py-1.5 text-muted-foreground transition-colors hover:text-foreground sm:w-56 sm:px-2.5"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="hidden flex-1 text-left text-[13px] sm:inline">Search components…</span>
        <kbd className="hidden items-center gap-0.5 rounded border border-border bg-card px-1.5 font-mono text-[10px] font-medium text-muted-foreground sm:inline-flex">
          ⌘K
        </kbd>
      </button>

      <CommandDialog open={open} onOpenChange={setOpen}>
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
            {ALL_COMPONENTS.map((component) => (
              <CommandItem
                key={component.slug}
                value={`${component.name} ${component.category}`}
                onSelect={() => {
                  goToComponent(component.slug, component.hasDemo, component.category);
                }}
              >
                <span>{component.name}</span>
                <span className="ml-auto text-xs text-muted-foreground capitalize">
                  {component.category}
                </span>
              </CommandItem>
            ))}
          </CommandGroup>
        </CommandList>
      </CommandDialog>
    </>
  );
}
