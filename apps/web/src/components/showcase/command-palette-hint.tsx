import { useSyncExternalStore } from "react";

import { getIsMacPlatform } from "#/lib/command-palette-keyboard";

interface CommandPaletteHintProps {
  readonly className?: string;
}

/** Keyboard shortcut reminder for the global component search palette. */
export function CommandPaletteHint({ className }: CommandPaletteHintProps) {
  const isMac = useSyncExternalStore(
    () => () => {},
    getIsMacPlatform,
    () => false,
  );

  return (
    <p className={className}>
      Press{" "}
      <kbd className="rounded border border-ui-border/60 bg-ui-surface px-1.5 py-0.5 font-mono text-[10px]">
        {isMac ? "⌘" : "Ctrl+"}K
      </kbd>{" "}
      to jump to any component
    </p>
  );
}
