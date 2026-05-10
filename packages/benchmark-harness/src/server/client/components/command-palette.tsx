import type { RefObject } from "react";
import { isMacLikePlatform } from "#/server/client/lib/format";

interface PaletteAction {
  id: string;
  label: string;
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
  const filtered = query.trim()
    ? actions.filter((a) => a.label.toLowerCase().includes(query.toLowerCase()))
    : actions;

  return (
    <div
      aria-hidden={!isOpen}
      aria-labelledby="command-palette-title"
      aria-modal="true"
      className={`bh-command-palette ${isOpen ? "" : "bh-command-palette--hidden"}`}
      id="command-palette"
      role="dialog"
    >
      {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions, jsx-a11y/click-events-have-key-events -- scrim dismisses dialog on click/Escape; Escape is handled by the parent dialog keydown */}
      <div className="bh-command-palette__scrim" onClick={onClose} />
      <div className="bh-glass bh-command-palette__panel">
        <p className="sr-only" id="command-palette-title">
          Command palette
        </p>
        <input
          aria-autocomplete="list"
          aria-controls="command-palette-list"
          autoComplete="off"
          className="bh-focus bh-field bh-command-palette__input"
          onChange={(e) => onQueryChange(e.target.value)}
          placeholder="Search actions…"
          ref={inputRef}
          type="search"
          value={query}
        />
        {/* eslint-disable-next-line jsx-a11y/prefer-tag-over-role -- command palette is not a native <select>; listbox/option is the correct ARIA pattern here */}
        <ul className="bh-command-palette__list" id="command-palette-list" role="listbox">
          {filtered.map((a) => (
            <li key={a.id} role="none">
              <button
                aria-selected={false}
                className="bh-focus bh-command-palette__item"
                onClick={() => onAction(a.id)}
                role="option"
                type="button"
              >
                {a.label}
              </button>
            </li>
          ))}
        </ul>
        <p className="bh-command-palette__hint" suppressHydrationWarning>
          {typeof window !== "undefined" && isMacLikePlatform() ? (
            <>
              Esc closes · <kbd className="bh-kbd">⌘K</kbd> toggles
            </>
          ) : (
            <>
              Esc closes · <kbd className="bh-kbd">Ctrl+K</kbd> toggles
            </>
          )}
        </p>
      </div>
    </div>
  );
}
