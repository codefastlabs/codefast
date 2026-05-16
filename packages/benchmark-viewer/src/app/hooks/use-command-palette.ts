import { useEffect, useEffectEvent, useRef, useState } from "react";
import type { ViewState } from "#/app/lib/hash";
import type { EmbeddedScenarioSeries } from "#/types";

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

interface CommandPaletteOptions {
  visibleScenarios: Array<EmbeddedScenarioSeries>;
  scenarioIndex: number;
  view: ViewState;
  patchView: (patch: Partial<ViewState>) => void;
  loadData: (isReload?: boolean) => void;
  onCopyLink: () => void;
}

export interface CommandPaletteHandle {
  isOpen: boolean;
  query: string;
  inputRef: React.RefObject<HTMLInputElement | null>;
  setQuery: (query: string) => void;
  close: () => void;
  handleCommand: (id: string) => void;
}

export function useCommandPalette({
  visibleScenarios,
  scenarioIndex,
  view,
  patchView,
  loadData,
  onCopyLink,
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
    switch (id) {
      case "reload-data":
        loadData(true);
        break;
      case "focus-search":
        document.getElementById("scenario-search")?.focus();
        break;
      case "scenario-next":
        if (scenarioIndex < visibleScenarios.length - 1) {
          patchView({ scenarioId: visibleScenarios[scenarioIndex + 1]!.id });
        }
        break;
      case "scenario-prev":
        if (scenarioIndex > 0) {
          patchView({ scenarioId: visibleScenarios[scenarioIndex - 1]!.id });
        }
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
