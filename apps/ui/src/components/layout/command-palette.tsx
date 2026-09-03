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

import { NewBadge } from "#/components/shared/new-badge";
import { DOC_KIND_BY_SLUG } from "#/features/package-docs/lib/doc-kinds";
import type { DocRef } from "#/features/package-docs/lib/doc-kinds";
import { getPackages } from "#/features/package-docs/lib/package-docs";
import { readingOrder } from "#/features/package-docs/lib/reading-order";
import type { PackageSummary } from "#/features/package-docs/lib/rendered-doc";
import { track } from "#/features/tracking/lib/tracking";
import {
  getCommandPaletteAriaKeyshortcuts,
  getCommandPaletteKeyboardAction,
  getIsMacPlatform,
} from "#/lib/command-palette-keyboard";
import type { PrimaryNavPath } from "#/lib/nav-links";
import { ALL_NAV } from "#/lib/nav-links";
import { COMPONENTS } from "#/registry/_core/components";

/** A palette row for one package document: where it goes, and the label after the package name (empty for the README). */
interface PackageDocRow {
  readonly ref: DocRef;
  readonly label: string;
}

/** The rows of one package: each kind and, beneath a directory kind, its pages; `@codefast/ui` has only its own section. */
function packageDocRows(pkg: PackageSummary): Array<PackageDocRow> {
  if (pkg.slug === "ui") {
    return [{ ref: { doc: "readme" }, label: "" }];
  }

  return readingOrder(pkg).map((ref) => {
    const kindLabel = DOC_KIND_BY_SLUG.get(ref.doc)?.label ?? ref.doc;

    if (ref.doc === "readme") {
      return { ref, label: "" };
    }

    return { ref, label: ref.page === undefined ? kindLabel : `${kindLabel} · ${ref.page}` };
  });
}

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
  // The package list lives server-side (built from `packages/*/package.json`); fetched once, the first
  // time the palette opens, so the header never pays for it.
  const [packages, setPackages] = useState<ReadonlyArray<PackageSummary>>([]);
  const packagesRequestedRef = useRef(false);

  useEffect(() => {
    if (!open || packagesRequestedRef.current) {
      return;
    }

    packagesRequestedRef.current = true;
    getPackages()
      .then(setPackages)
      .catch(() => {
        packagesRequestedRef.current = false;
      });
  }, [open]);
  const searchTrackTimeoutRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const lastTrackedQueryRef = useRef("");

  const handleSearchChange = useCallback((value: string) => {
    setSearch(value);

    if (searchTrackTimeoutRef.current) {
      clearTimeout(searchTrackTimeoutRef.current);
    }

    // Debounced, and only re-tracked once the live query actually changes —
    // otherwise every keystroke of a paused typist would fire its own event.
    // Length matches the live cmdk filter string (untrimmed); trim only to skip
    // whitespace-only input.
    searchTrackTimeoutRef.current = setTimeout(() => {
      if (!value.trim() || value === lastTrackedQueryRef.current) {
        return;
      }

      lastTrackedQueryRef.current = value;
      track("search_query", { queryLength: value.length });
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
      track("select_search_result", {
        resultType: "page",
        destination: to,
        hadQuery: search.trim().length > 0,
      });
      handleOpenChange(false);
      void navigate({ to });
    },
    [handleOpenChange, navigate, search],
  );

  const goToComponent = useCallback(
    (slug: string, hasDemo: boolean, name: string) => {
      track("select_search_result", {
        resultType: "component",
        slug,
        hadQuery: search.trim().length > 0,
        hasDemo,
      });
      handleOpenChange(false);

      if (hasDemo) {
        // Components with a demo have a dedicated detail page.
        void navigate({ to: "/ui/components/$slug", params: { slug } });
      } else {
        // Sidebar (no demo) jumps to its A–Z letter band on the overview.
        void navigate({ to: "/ui/components", hash: `letter-${name.charAt(0).toUpperCase()}` });
      }
    },
    [handleOpenChange, navigate, search],
  );

  const goToPackageDoc = useCallback(
    (pkg: string, { doc, page }: DocRef) => {
      track("select_search_result", {
        resultType: "package",
        slug: pkg,
        hadQuery: search.trim().length > 0,
      });
      handleOpenChange(false);

      if (pkg === "ui") {
        void navigate({ to: "/ui" });
      } else if (page !== undefined) {
        void navigate({ to: "/docs/$pkg/$doc/$page", params: { pkg, doc, page } });
      } else if (doc === "readme") {
        void navigate({ to: "/docs/$pkg", params: { pkg } });
      } else {
        void navigate({ to: "/docs/$pkg/$doc", params: { pkg, doc } });
      }
    },
    [handleOpenChange, navigate, search],
  );

  return (
    <>
      <Button
        onClick={() => {
          handleOpenChange(true);
        }}
        aria-keyshortcuts={ariaKeyshortcuts}
        aria-label="Search the site"
        variant="secondary"
      >
        <SearchIcon className="size-4 shrink-0" />
        <span className="hidden flex-1 text-start text-sm lg:inline">Search…</span>
        <Kbd className="hidden lg:inline-flex">/</Kbd>
      </Button>

      <CommandDialog open={open} onOpenChange={handleOpenChange}>
        <Command>
          <CommandInput
            placeholder="Search packages, components, and pages…"
            value={search}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            <CommandEmpty>No results found.</CommandEmpty>
            <CommandGroup heading="Pages">
              {ALL_NAV.map((page) => (
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
            {packages.length > 0 ? (
              <CommandGroup heading="Packages">
                {packages.flatMap((pkg) =>
                  packageDocRows(pkg).map(({ ref, label }) => {
                    return (
                      <CommandItem
                        key={`${pkg.slug}/${ref.doc}/${ref.page ?? ""}`}
                        value={`package ${pkg.name} ${label}`}
                        onSelect={() => {
                          goToPackageDoc(pkg.slug, ref);
                        }}
                      >
                        <span className="grow">
                          {pkg.name}
                          {label ? <span className="text-ui-muted"> · {label}</span> : null}
                        </span>
                        <span className="font-mono text-xs text-ui-muted" data-slot="command-shortcut">
                          v{pkg.version}
                        </span>
                      </CommandItem>
                    );
                  }),
                )}
              </CommandGroup>
            ) : null}
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
