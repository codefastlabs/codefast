import { DEFAULT_COLOR_SCHEME, useColorScheme } from "@codefast/theme";
import type { ColorScheme } from "@codefast/theme";
import { Button } from "@codefast/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";
import { useEffect, useState } from "react";

type ThemeToggleProps = Omit<ComponentProps<typeof Button>, "children" | "onClick" | "size" | "variant">;

const SEQUENCE: ReadonlyArray<ColorScheme> = ["light", "dark", "automatic"];
const LABELS = { light: "Light", dark: "Dark", automatic: "System" } as const;

export function ThemeToggle(props: ThemeToggleProps): ReactElement {
  const { colorScheme, isPending, setColorScheme } = useColorScheme();
  const next = SEQUENCE[(SEQUENCE.indexOf(colorScheme) + 1) % SEQUENCE.length] ?? "light";

  // Labels must render the SSR fallback until mount: hydration never patches mismatched
  // attributes, so an attribute derived from the localStorage-restored state would stay stale.
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const shown = mounted ? colorScheme : DEFAULT_COLOR_SCHEME;
  const shownNext = mounted ? next : "light";

  return (
    <Button
      aria-label={`Color scheme: ${LABELS[shown]}. Switch to ${LABELS[shownNext]}.`}
      disabled={isPending}
      size="icon"
      title={LABELS[shown]}
      variant="outline"
      {...props}
      // ThemeToggle owns the click: cycle light → dark → system via @codefast/theme.
      onClick={() => {
        void setColorScheme(next);
      }}
    >
      {/* Icons are chosen by CSS from `html[data-appearance]` (set by the inline script before first
          paint), not React state — SSR renders the fallback state, so a state-picked icon would swap
          after hydration on every refresh. */}
      <Sun className="hidden size-4 [html[data-appearance=light]_&]:block" />
      <Moon className="hidden size-4 [html[data-appearance=dark]_&]:block" />
      <Monitor className="hidden size-4 [html[data-appearance=automatic]_&]:block" />
    </Button>
  );
}
