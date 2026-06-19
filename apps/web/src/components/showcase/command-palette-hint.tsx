import type { ComponentProps } from "react";
import { useSyncExternalStore } from "react";

import { getIsMacPlatform } from "#/lib/command-palette-keyboard";

/** Keyboard shortcut reminder for the global component search palette. */
export function CommandPaletteHint(props: ComponentProps<"p">) {
  const isMac = useSyncExternalStore(
    () => () => {},
    getIsMacPlatform,
    () => false,
  );

  return (
    <p {...props}>
      Press{" "}
      <kbd className="rounded border border-ui-border/60 bg-ui-surface px-1.5 py-0.5 font-mono text-[10px]">
        {isMac ? "⌘" : "Ctrl+"}K
      </kbd>{" "}
      to jump to any component
    </p>
  );
}
