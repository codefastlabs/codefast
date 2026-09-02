import type { RefObject } from "react";
import { useEffect, useEffectEvent, useRef, useState } from "react";

import type { ViewState } from "#/app/lib/hash";

/**
 * The command palette's built-in actions, in display order.
 *
 * @since 0.3.16-canary.3
 */
export const PALETTE_ACTIONS = [
  { id: "reload-data", label: "Reload bench data from server" },
  { id: "focus-search", label: "Focus scenario search" },
  { id: "scenario-next", label: "Next scenario" },
  { id: "scenario-prev", label: "Previous scenario" },
  { id: "toggle-bands", label: "Toggle P25–P75 band" },
  { id: "toggle-log", label: "Toggle log Y axis" },
  { id: "toggle-ratio", label: "Toggle primary ratios" },
  { id: "reset-zoom", label: "Reset chart zoom" },
  { id: "download-png", label: "Download chart as PNG" },
  { id: "copy-link", label: "Copy link to this view" },
] as const;

/** Prefix marking a palette action id as a jump to that scenario. */
export const PALETTE_SCENARIO_ACTION_PREFIX = "scenario:";

interface CommandPaletteOptions {
  view: ViewState;
  patchView: (patch: Partial<ViewState>) => void;
  loadData: (isReload?: boolean) => void;
  onCopyLink: () => void;
  onScenarioStep: (delta: 1 | -1) => void;
  onScenarioJump: (scenarioId: string) => void;
}

/**
 * The open state, query, and callbacks the command palette UI is driven by.
 *
 * @since 0.3.16-canary.3
 */
export interface CommandPaletteHandle {
  isOpen: boolean;
  query: string;
  inputRef: RefObject<HTMLInputElement | null>;
  setQuery: (query: string) => void;
  close: () => void;
  handleCommand: (id: string) => void;
}

/**
 * Binds the global palette shortcut and returns the state and handlers the command palette renders from.
 *
 * @since 0.3.16-canary.3
 */
export function useCommandPalette({
  view,
  patchView,
  loadData,
  onCopyLink,
  onScenarioStep,
  onScenarioJump,
}: CommandPaletteOptions): CommandPaletteHandle {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const onBenchGlobalKeydown = useEffectEvent((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
      e.preventDefault();
      setIsOpen((open) => {
        if (!open) {
          setQuery("");
        }
        return !open;
      });
      return;
    }
    if (e.key === "Escape" && isOpen) {
      setIsOpen(false);
    }
  });

  useEffect(() => {
    window.addEventListener("keydown", onBenchGlobalKeydown);
    return () => window.removeEventListener("keydown", onBenchGlobalKeydown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
    }
  }, [isOpen]);

  function close() {
    setIsOpen(false);
  }

  function handleCommand(id: string) {
    close();
    if (id.startsWith(PALETTE_SCENARIO_ACTION_PREFIX)) {
      onScenarioJump(id.slice(PALETTE_SCENARIO_ACTION_PREFIX.length));
      return;
    }
    switch (id) {
      case "reload-data":
        loadData(true);
        break;
      case "focus-search":
        document.getElementById("scenario-search")?.focus();
        break;
      case "scenario-next":
        onScenarioStep(1);
        break;
      case "scenario-prev":
        onScenarioStep(-1);
        break;
      case "toggle-bands":
        patchView({ showBands: !view.showBands });
        break;
      case "toggle-log":
        patchView({ useLogScale: !view.useLogScale });
        break;
      case "toggle-ratio":
        patchView({ showRatio: !view.showRatio });
        break;
      case "reset-zoom":
        document.getElementById("chart-reset-zoom-btn")?.click();
        break;
      case "download-png":
        document.getElementById("chart-download-png-btn")?.click();
        break;
      case "copy-link":
        onCopyLink();
        break;
    }
  }

  return { isOpen, query, inputRef, setQuery, close, handleCommand };
}
