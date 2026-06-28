import { useColorScheme } from "@codefast/theme";
import type { ColorScheme } from "@codefast/theme";
import { Button } from "@codefast/ui/button";
import { Monitor, Moon, Sun } from "lucide-react";
import type { ComponentProps, ReactElement } from "react";

type ThemeToggleProps = Omit<ComponentProps<typeof Button>, "children" | "onClick" | "size" | "variant">;

const SEQUENCE: ReadonlyArray<ColorScheme> = ["light", "dark", "automatic"];
const ICONS = { light: Sun, dark: Moon, automatic: Monitor } as const;
const LABELS = { light: "Light", dark: "Dark", automatic: "System" } as const;

export function ThemeToggle(props: ThemeToggleProps): ReactElement {
  const { colorScheme, isPending, setColorScheme } = useColorScheme();
  const Icon = ICONS[colorScheme];
  const next = SEQUENCE[(SEQUENCE.indexOf(colorScheme) + 1) % SEQUENCE.length] ?? "light";

  return (
    <Button
      aria-label={`Color scheme: ${LABELS[colorScheme]}. Switch to ${LABELS[next]}.`}
      disabled={isPending}
      size="icon"
      title={LABELS[colorScheme]}
      variant="outline"
      {...props}
      // ThemeToggle owns the click: cycle light → dark → system via @codefast/theme.
      onClick={() => {
        void setColorScheme(next);
      }}
    >
      <Icon className="size-4" />
    </Button>
  );
}
