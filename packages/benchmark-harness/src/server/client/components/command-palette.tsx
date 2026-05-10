import type { KeyboardEvent as ReactKeyboardEvent, RefObject } from "react";
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { isMacLikePlatform } from "#/server/client/lib/format";

interface PaletteAction {
  id: string;
  label: string;
}

/** Matches SSR (no navigator): Ctrl+K until mount, then ⌘K on mac-like clients. */
function PaletteShortcutHint() {
  const [useMacKeys, setUseMacKeys] = useState(false);

  useEffect(() => {
    setUseMacKeys(isMacLikePlatform());
  }, []);

  const label = useMacKeys ? "⌘K" : "Ctrl+K";

  return (
    <>
      Esc closes · <kbd className="bh-kbd">{label}</kbd> toggles · ↑↓ navigate · Enter runs
    </>
  );
}

interface CommandPaletteProps {
  isOpen: boolean;
  query: string;
  actions: Array<PaletteAction>;
  inputRef: RefObject<HTMLInputElement | null>;
  onQueryChange: (q: string) => void;
  onClose: () => void;
  onAction: (id: string) => void;
}

export function CommandPalette({
  isOpen,
  query,
  actions,
  inputRef,
  onQueryChange,
  onClose,
  onAction,
}: CommandPaletteProps) {
  const [highlightedIndex, setHighlightedIndex] = useState(0);
  const highlightedIndexRef = useRef(0);
  highlightedIndexRef.current = highlightedIndex;
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);

  const filtered = useMemo(
    () =>
      query.trim()
        ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
        : actions,
    [actions, query],
  );

  /** When this string changes, the filtered result set changed — reset highlight (not on arrow-key-only updates). */
  const filterEpoch = useMemo(
    () => `${query}\0${filtered.map((a) => a.id).join("\0")}`,
    [filtered, query],
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }
    setHighlightedIndex(filtered.length === 0 ? -1 : 0);
  }, [filterEpoch, filtered.length, isOpen]);

  useLayoutEffect(() => {
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
    setHighlightedIndex((prev) => {
      const n = filtered.length;
      if (n === 0) {
        return -1;
      }
      const cur = prev < 0 ? 0 : prev;
      let next = cur + delta;
      next = ((next % n) + n) % n;
      return next;
    });
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
      const idx = highlightedIndexRef.current < 0 ? 0 : highlightedIndexRef.current;
      handleActivateIndex(idx);
    }
  }

  const activeOptionId =
    highlightedIndex >= 0 && filtered[highlightedIndex]
      ? `command-palette-opt-${filtered[highlightedIndex]!.id}`
      : undefined;

  return (
    <div
      aria-hidden={!isOpen}
      aria-labelledby="command-palette-title"
      aria-modal="true"
      className={`bh-command-palette ${isOpen ? "" : "bh-command-palette--hidden"}`}
      id="command-palette"
      onKeyDownCapture={handleDialogKeyDownCapture}
      role="dialog"
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- scrim dismisses on click; Escape handled on dialog capture */}
      <div className="bh-command-palette__scrim" onClick={onClose} />
      <div className="bh-glass bh-command-palette__panel">
        <p className="sr-only" id="command-palette-title">
          Command palette
        </p>
        <input
          aria-activedescendant={activeOptionId}
          aria-autocomplete="list"
          aria-controls="command-palette-list"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          autoComplete="off"
          className="bh-focus bh-field bh-command-palette__input"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search actions…"
          ref={inputRef}
          role="combobox"
          type="text"
          value={query}
        />
        <ul
          aria-multiselectable={false}
          className="bh-command-palette__list"
          id="command-palette-list"
          role="listbox"
        >
          {filtered.length === 0 ? (
            <li className="bh-command-palette__empty" role="presentation">
              No matching actions
            </li>
          ) : (
            filtered.map((a, i) => (
              <li key={a.id} role="none">
                <button
                  aria-selected={i === highlightedIndex}
                  className={`bh-focus bh-command-palette__item ${i === highlightedIndex ? "bh-command-palette__item--active" : ""}`}
                  id={`command-palette-opt-${a.id}`}
                  onClick={() => onAction(a.id)}
                  onMouseEnter={() => setHighlightedIndex(i)}
                  ref={(el) => {
                    itemRefs.current[i] = el;
                  }}
                  role="option"
                  tabIndex={-1}
                  type="button"
                >
                  {a.label}
                </button>
              </li>
            ))
          )}
        </ul>
        <p className="bh-command-palette__hint">
          <PaletteShortcutHint />
        </p>
      </div>
    </div>
  );
}
