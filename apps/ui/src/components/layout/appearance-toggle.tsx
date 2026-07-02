import type { Appearance } from "@codefast/theme";
import { useAppearance } from "@codefast/theme";
import { Button } from "@codefast/ui/button";
import { MonitorIcon, MoonStarIcon, SunIcon } from "lucide-react";
import type { ReactElement } from "react";

const SEQUENCE: ReadonlyArray<Appearance> = ["light", "dark", "automatic"];
const LABELS = { light: "Light", dark: "Dark", automatic: "System" } as const satisfies Record<Appearance, string>;

/** Compact appearance switcher: one icon button that cycles light → dark → system on click. */
export function AppearanceToggle(): ReactElement {
  const { appearance, isPending, setAppearance } = useAppearance();
  const next = SEQUENCE[(SEQUENCE.indexOf(appearance) + 1) % SEQUENCE.length] ?? "light";

  return (
    <Button
      aria-label={`Appearance: ${LABELS[appearance]}. Switch to ${LABELS[next]}.`}
      className="text-ui-muted hover:text-ui-fg"
      disabled={isPending}
      size="icon"
      title={LABELS[appearance]}
      variant="ghost"
      onClick={() => {
        void setAppearance(next);
      }}
    >
      {/* The icon is chosen by CSS from `html[data-appearance]` (set by AppearanceScript before first
          paint), not React state — so it is correct on the first frame with no hydration flash. */}
      <SunIcon className="hidden size-4 [html[data-appearance=light]_&]:block" strokeWidth={1.75} />
      <MoonStarIcon className="hidden size-4 [html[data-appearance=dark]_&]:block" strokeWidth={1.75} />
      <MonitorIcon className="hidden size-4 [html[data-appearance=automatic]_&]:block" strokeWidth={1.75} />
    </Button>
  );
}
