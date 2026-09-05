import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { useEffect, useMemo, useRef, useState } from "react";

import { useHasHydrated } from "#/app/hooks/use-has-hydrated";
import { isMacLikePlatform } from "#/app/lib/format";
import { cn, tv } from "#/app/lib/utils";

interface PaletteAction {
  id: string;
  label: string;
}

const paletteItem = tv({
  base: "focus-visible:outline-bh-blue mb-0.5 w-full cursor-pointer rounded-lg px-3 py-2.5 text-start text-sm text-zinc-200 hover:bg-white/6 focus-visible:outline focus-visible:outline-offset-2",
  variants: {
    active: {
      true: "bg-white/10 text-white",
    },
  },
});

/** Matches SSR (no navigator): Ctrl+K until hydration, then ⌘K on mac-like clients. */
function PaletteShortcutHint() {
  const hydrated = useHasHydrated();

  const label = hydrated && isMacLikePlatform() ? "⌘K" : "Ctrl+K";

  return (
    <>
      Esc closes ·{" "}
      <kbd className="rounded border border-zinc-700 bg-zinc-800 px-1.5 py-px font-mono text-zinc-300">{label}</kbd>{" "}
      toggles · ↑↓ navigate · Enter runs
    </>
  );
}

interface CommandPaletteProps {
  isOpen: boolean;
  query: string;
  actions: ReadonlyArray<PaletteAction>;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  onAction: (id: string) => void;
}

/**
 * Modal action launcher: filters the given actions by query and runs one via click or keyboard.
 *
 * @since 0.3.16-canary.1
 */
export function CommandPalette({
  isOpen,
  query,
  actions,
  inputRef,
  onQueryChange,
  onClose,
  onAction,
}: CommandPaletteProps) {
  // An arrow-key highlight, tagged with the result set it was made for; null while unset.
  const [highlight, setHighlight] = useState<{ epoch: string; index: number } | null>(null);
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filtered = useMemo(
    () =>
      query.trim() ? actions.filter((action) => action.label.toLowerCase().includes(query.toLowerCase())) : actions,
    [actions, query],
  );

  /** When this string changes, the filtered result set changed — reset highlight (not on arrow-key-only updates). */
  const filterEpoch = useMemo(() => `${query}\0${filtered.map((action) => action.id).join("\0")}`, [filtered, query]);

  // A closed palette holds no highlight, so reopening starts back at the first action.
  if (!isOpen && highlight !== null) {
    setHighlight(null);
  }

  // A highlight made for another result set no longer applies — fall back to the first action.
  const highlightedIndex = highlight?.epoch === filterEpoch ? highlight.index : filtered.length === 0 ? -1 : 0;

  // useEffect is sufficient here — scrollIntoView is a visual side effect that
  // does not need to run synchronously before the browser paints, and useLayoutEffect
  // would emit an SSR warning because its output cannot be serialised by the server.
  useEffect(() => {
    if (!isOpen || highlightedIndex < 0) {
      return;
    }
    itemRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex, isOpen]);

  function handleActivateIndex(index: number) {
    const entry = filtered[index];
    if (entry) {
      onAction(entry.id);
    }
  }

  function moveHighlight(delta: number) {
    const actionCount = filtered.length;
    if (actionCount === 0) {
      return;
    }
    const currentIndex = highlightedIndex < 0 ? 0 : highlightedIndex;
    const nextIndex = (((currentIndex + delta) % actionCount) + actionCount) % actionCount;
    setHighlight({ epoch: filterEpoch, index: nextIndex });
  }

  function handleDialogKeyDownCapture(e: ReactKeyboardEvent<HTMLDivElement>) {
    if (e.key === "Escape") {
      if (!isOpen) {
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      onClose();
      return;
    }
    if (!isOpen) {
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      moveHighlight(1);
      return;
    }
    if (e.key === "ArrowUp") {
      e.preventDefault();
      moveHighlight(-1);
      return;
    }
    if (e.key === "Enter" && !e.nativeEvent.isComposing) {
      if (filtered.length === 0) {
        return;
      }
      e.preventDefault();
      const activeIndex = highlightedIndex < 0 ? 0 : highlightedIndex;
      handleActivateIndex(activeIndex);
    }
  }

  const activeOptionId =
    highlightedIndex >= 0 && filtered[highlightedIndex]
      ? `command-palette-opt-${filtered[highlightedIndex].id}`
      : undefined;

  return (
    <div
      aria-hidden={!isOpen}
      aria-labelledby="command-palette-title"
      aria-modal="true"
      className={cn(
        "fixed inset-0 z-400 flex items-start justify-center px-3 pt-[max(0.75rem,env(safe-area-inset-top,0px))] sm:px-4 sm:pt-[min(20vh,10rem)]",
        { hidden: !isOpen },
      )}
      id="command-palette"
      onKeyDownCapture={handleDialogKeyDownCapture}
      role="dialog"
    >
      <div
        aria-label="Close command palette"
        className="bg-bh-overlay/75 absolute inset-0 m-0 cursor-default border-0 p-0 backdrop-blur-xs"
        onClick={onClose}
        onKeyDown={onClose}
        role="button"
        tabIndex={0}
      />
      <div className="border-bh-border bg-bh-surface relative z-1 mt-2 max-h-[min(85dvh,calc(100dvh-2.5rem))] w-full max-w-lg overflow-hidden rounded-[1.25rem] border p-0 shadow-(--shadow-bh-glass) backdrop-blur-xl backdrop-saturate-180 sm:mt-0 sm:max-h-none">
        <p
          className="absolute -m-px h-px w-px overflow-hidden border-0 p-0 whitespace-nowrap [clip:rect(0,0,0,0)]"
          id="command-palette-title"
        >
          Command palette
        </p>
        <input
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls="command-palette-list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          aria-label="Search actions"
          autoComplete="off"
          className="focus:border-bh-blue focus:ring-bh-blue/35 focus-visible:outline-bh-blue w-full rounded-none border-0 border-b border-white/8 bg-black/25 px-4 py-3 text-sm text-zinc-100 shadow-(--shadow-bh-field-inset) placeholder:text-zinc-500 focus:ring-2 focus:outline-none focus-visible:outline focus-visible:outline-offset-2"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search actions…"
          ref={inputRef}
          type="text"
          value={query}
        />
        <ul
          aria-multiselectable={false}
          className="max-h-[min(50dvh,17.5rem)] list-none overflow-y-auto overscroll-contain p-2 sm:max-h-[min(48vh,17.5rem)]"
          id="command-palette-list"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="px-3 py-6 text-center text-sm text-zinc-500" role="presentation">
              No matching actions
            </li>
          ) : (
            filtered.map((action, actionIndex) => (
              <li key={action.id} role="none">
                <button
                  aria-selected={actionIndex === highlightedIndex}
                  className={paletteItem({ active: actionIndex === highlightedIndex })}
                  id={`command-palette-opt-${action.id}`}
                  onClick={() => onAction(action.id)}
                  onMouseEnter={() => setHighlight({ epoch: filterEpoch, index: actionIndex })}
                  ref={(button) => {
                    itemRefs.current[actionIndex] = button;
                  }}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  {action.label}
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="border-t border-white/6 px-3 py-2 text-[0.6875rem] text-zinc-500">
          <PaletteShortcutHint />
        </p>
      </div>
    </div>
  );
}
