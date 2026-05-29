import type { ReactElement } from "react";
import type { ColorScheme } from "@codefast/theme";
import { colorSchemeSchema, useColorScheme } from "@codefast/theme";
import { ToggleGroup, ToggleGroupItem } from "@codefast/ui/toggle-group";
import type { LucideIcon } from "lucide-react";
import { MonitorIcon, MoonStarIcon, SunIcon } from "lucide-react";

type SchemeConfig = {
  readonly label: string;
  readonly Icon: LucideIcon;
};

const SCHEME_CONFIG = {
  automatic: { label: "System theme", Icon: MonitorIcon },
  light: { label: "Light theme", Icon: SunIcon },
  dark: { label: "Dark theme", Icon: MoonStarIcon },
} as const satisfies Record<ColorScheme, SchemeConfig>;

const SCHEME_KEYS = getRecordKeys(SCHEME_CONFIG);

function getRecordKeys<KeyName extends string>(
  record: Readonly<Record<KeyName, unknown>>,
): ReadonlyArray<KeyName> {
  return Object.keys(record) as Array<KeyName>;
}

function isColorScheme(value: string): value is ColorScheme {
  return colorSchemeSchema.safeParse(value).success;
}

export function FooterAppearanceToggle(): ReactElement {
  const { colorScheme, setColorScheme } = useColorScheme();

  function handleValueChange(value: string): void {
    if (isColorScheme(value)) {
      void setColorScheme(value);
    }
  }

  return (
    <ToggleGroup
      type="single"
      value={colorScheme}
      onValueChange={handleValueChange}
      aria-label="Appearance"
      spacing={0}
      className="gap-0 rounded-full border border-border bg-muted p-0.5"
    >
      {SCHEME_KEYS.map((value) => {
        const { label, Icon } = SCHEME_CONFIG[value];

        return (
          <ToggleGroupItem
            key={value}
            value={value}
            aria-label={label}
            title={label}
            className="size-8 min-w-8 rounded-full! border-0 bg-transparent p-0 text-muted-foreground shadow-none hover:bg-transparent hover:text-foreground focus-visible:ring-2 focus-visible:ring-primary/30 data-[spacing=0]:rounded-full! data-[state=on]:bg-accent data-[state=on]:text-foreground"
          >
            <Icon className="size-4" strokeWidth={1.75} />
          </ToggleGroupItem>
        );
      })}
    </ToggleGroup>
  );
}
