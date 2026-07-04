import { DEFAULT_APPEARANCE, useAppearance } from "@codefast/theme";
import type { Appearance } from "@codefast/theme";
import { Button } from "@codefast/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";
import { useEffect, useState } from "react";

type AppearanceToggleProps = Omit<ComponentProps<typeof Button>, "children" | "onClick" | "size" | "variant">;

const SEQUENCE: ReadonlyArray<Appearance> = ["light", "dark", "automatic"];
const LABELS = { light: "Light", dark: "Dark", automatic: "System" } as const;

/**
 * Compact appearance switcher: one icon button that cycles Light → Dark → Auto.
 *
 * The visible icon is driven by CSS from `html[data-appearance]` — set by the inline script
 * before first paint — so the first frame always shows the stored appearance.
 */
export function AppearanceToggle(props: AppearanceToggleProps): ReactElement {
  const { appearance, isPending, setAppearance } = useAppearance();
  const next = SEQUENCE[(SEQUENCE.indexOf(appearance) + 1) % SEQUENCE.length] ?? "light";

  /**
   * Labels render the SSR fallback until mount: hydration never patches mismatched attributes,
   * so an attribute derived from the localStorage-restored appearance would stay stale.
   */
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shown = mounted ? appearance : DEFAULT_APPEARANCE;
  const shownNext = mounted ? next : "light";

  return (
    <Button
      aria-label={`Appearance: ${LABELS[shown]}. Switch to ${LABELS[shownNext]}.`}
      disabled={isPending}
      size="icon"
      title={LABELS[shown]}
      variant="outline"
      {...props}
      /* AppearanceToggle owns the click: cycles the appearance Light → Dark → Auto via @codefast/theme. */
      onClick={() => {
        void setAppearance(next);
      }}
    >
      {/* One icon per appearance, shown by CSS from `html[data-appearance]` — a state-picked icon
          would render the SSR fallback first and visibly swap after hydration on every refresh. */}
      <Sun className="hidden size-4 [html[data-appearance=light]_&]:block" />
      <Moon className="hidden size-4 [html[data-appearance=dark]_&]:block" />
      <Monitor className="hidden size-4 [html[data-appearance=automatic]_&]:block" />
    </Button>
  );
}
