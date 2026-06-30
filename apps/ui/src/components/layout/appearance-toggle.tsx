import type { ColorScheme } from "@codefast/theme";
import { colorSchemes, colorSchemeSchema, useColorScheme } from "@codefast/theme";
import { Button } from "@codefast/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from "@codefast/ui/dropdown-menu";
import type { LucideIcon } from "lucide-react";
import { MonitorIcon, MoonStarIcon, SunIcon } from "lucide-react";
import type { ReactElement } from "react";

type SchemeConfig = {
  readonly label: string;
  readonly Icon: LucideIcon;
};

const SCHEME_CONFIG = {
  light: { label: "Light", Icon: SunIcon },
  dark: { label: "Dark", Icon: MoonStarIcon },
  automatic: { label: "System", Icon: MonitorIcon },
} as const satisfies Record<ColorScheme, SchemeConfig>;

function isColorScheme(value: string): value is ColorScheme {
  return colorSchemeSchema.safeParse(value).success;
}

/** Compact appearance switcher: one icon button reflecting the current scheme, with a radio menu to pick. */
export function AppearanceToggle(): ReactElement {
  const { colorScheme, setColorScheme } = useColorScheme();

  function handleValueChange(value: string): void {
    if (isColorScheme(value)) {
      void setColorScheme(value);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Appearance" className="text-ui-muted hover:text-ui-fg">
          {/* The trigger icon is chosen by CSS from `html[data-appearance]` (set by AppearanceScript before
              first paint), not React state — so it is correct on the first frame with no hydration flash. */}
          <SunIcon className="hidden size-4 [html[data-appearance=light]_&]:block" strokeWidth={1.75} />
          <MoonStarIcon className="hidden size-4 [html[data-appearance=dark]_&]:block" strokeWidth={1.75} />
          <MonitorIcon className="hidden size-4 [html[data-appearance=automatic]_&]:block" strokeWidth={1.75} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        <DropdownMenuRadioGroup value={colorScheme} onValueChange={handleValueChange}>
          {colorSchemes.map((value) => {
            const { label: itemLabel, Icon: ItemIcon } = SCHEME_CONFIG[value];

            return (
              <DropdownMenuRadioItem key={value} value={value}>
                <ItemIcon strokeWidth={1.75} />
                {itemLabel}
              </DropdownMenuRadioItem>
            );
          })}
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
