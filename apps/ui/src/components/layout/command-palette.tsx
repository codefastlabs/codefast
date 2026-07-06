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
import { useCallback, useEffect, useEffectEvent, useRef, useState, useSyncExternalStore } from "react";

import { NewBadge } from "#/components/showcase/new-badge";
import {
  getCommandPaletteAriaKeyshortcuts,
  getCommandPaletteKeyboardAction,
  getIsMacPlatform,
} from "#/lib/command-palette-keyboard";
import type { PrimaryNavPath } from "#/lib/nav-links";
import { PRIMARY_NAV } from "#/lib/nav-links";
import { getTracker } from "#/lib/tracking";
import { COMPONENTS } from "#/registry/_core/components";

/** Debounce before tracking a search query — avoids firing `search_query` per keystroke. */
const SEARCH_TRACK_DEBOUNCE_MS = 500;

/**
 * Global command palette: `/`, ⌘/ / Ctrl+/, and ⌘K / Ctrl+K. Renders its own
 * trigger (a search field on desktop, an icon button on mobile) plus the dialog,
 * and reads the lightweight component registry so it never pulls the heavy demo bundle.
 */
export function CommandPalette() {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const isMac = useSyncExternalStore(
    () => () => {},
    getIsMacPlatform,
    () => false,
  );
  const ariaKeyshortcuts = getCommandPaletteAriaKeyshortcuts(isMac);

  const [search, setSearch] = useState("");
  const searchTrackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTrackedQueryRef = useRef("");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);

    if (searchTrackTimeoutRef.current) {
      clearTimeout(searchTrackTimeoutRef.current);
    }

    // Debounced, and only re-tracked once the (trimmed) query actually changes —
    // otherwise every keystroke of a paused typist would fire its own event.
    searchTrackTimeoutRef.current = setTimeout(() => {
      const trimmed = value.trim();

      if (trimmed && trimmed !== lastTrackedQueryRef.current) {
        lastTrackedQueryRef.current = trimmed;
        getTracker().track("search_query", { query: trimmed, queryLength: trimmed.length });
      }
    }, SEARCH_TRACK_DEBOUNCE_MS);
  }, []);

  const handleOpenChange = useCallback((next: boolean) => {
    setOpen(next);

    if (!next) {
      setSearch("");
      lastTrackedQueryRef.current = "";

      if (searchTrackTimeoutRef.current) {
        clearTimeout(searchTrackTimeoutRef.current);
      }
    }
  }, []);

  const onGlobalKeyDown = useEffectEvent((event: KeyboardEvent): void => {
    const action = getCommandPaletteKeyboardAction(event, open);

    if (!action) {
      return;
    }

    event.preventDefault();

    if (action === "toggle") {
      handleOpenChange(!open);
      return;
    }

    handleOpenChange(true);
  });

  useEffect(() => {
    document.addEventListener("keydown", onGlobalKeyDown);

    return () => {
      document.removeEventListener("keydown", onGlobalKeyDown);
    };
  }, []);

  const goToPage = useCallback(
    (to: PrimaryNavPath) => {
      handleOpenChange(false);
      void navigate({ to });
    },
    [handleOpenChange, navigate],
  );

  const goToComponent = useCallback(
    (slug: string, hasDemo: boolean, name: string) => {
      handleOpenChange(false);

      if (hasDemo) {
        // Components with a demo have a dedicated detail page.
        void navigate({ to: "/components/$slug", params: { slug } });
      } else {
        // Sidebar (no demo) jumps to its A–Z letter band on the overview.
        void navigate({ to: "/components", hash: `letter-${name.charAt(0).toUpperCase()}` });
      }
    },
    [handleOpenChange, navigate],
  );

  return (
    <>
      <Button
        onClick={() => {
          handleOpenChange(true);
        }}
        aria-keyshortcuts={ariaKeyshortcuts}
        aria-label="Search components"
        variant="secondary"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="hidden flex-1 text-start text-sm lg:inline">Search components…</span>
        <Kbd className="hidden lg:inline-flex">/</Kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command>
          <CommandInput placeholder="Search components and pages…" value={search} onValueChange={handleSearchChange} />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {PRIMARY_NAV.map((page) => (
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
                    goToComponent(component.slug, component.hasDemo, component.name);
                  }}
                >
                  <span className="grow">{component.name}</span>
                  {component.isNew ? <NewBadge /> : null}
                  <span className="text-xs text-ui-muted capitalize" data-slot="command-shortcut">
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
