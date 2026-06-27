import { Button } from "#/components/button";
import { Kbd, KbdGroup } from "#/components/kbd";

import preview from "../.storybook/preview";

/**
 * Kbd — a pure-display, layout-only leaf. Both `Kbd` and `KbdGroup` render a
 * semantic `<kbd>` and accept only native `ComponentProps<"kbd">` (no enum /
 * boolean / number variant of their own), so the only meaningful Control is the
 * key text via `children`. Content here is authored for Storybook against the
 * component's own public API — it is NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { children: "⌘" },
  argTypes: {
    children: { control: "text" },
  },
  component: Kbd,
  parameters: {
    controls: { include: ["children"] },
    docs: {
      description: {
        component: [
          "Displays a keyboard key or shortcut as inline text via a semantic `<kbd>` element.",
          "",
          "**Anatomy:** `Kbd` for a single key, or `KbdGroup > Kbd…` to compose a multi-key shortcut.",
          "Styling adapts automatically inside tooltips.",
        ].join("\n"),
      },
    },
  },
  subcomponents: { KbdGroup },
  title: "Display/Kbd",
});

const SHORTCUTS = [
  { action: "Open command palette", keys: ["⌘", "K"] },
  { action: "Save document", keys: ["⌘", "S"] },
  { action: "Toggle sidebar", keys: ["⌘", "B"] },
];

/** A single key — driven entirely by the `children` Control. */
export const Default = meta.story();

/** Several shortcuts, each composed from `KbdGroup` wrapping individual `Kbd` keys. */
export const Shortcuts = meta.story({
  render: () => (
    <div className="w-full max-w-xs space-y-2.5">
      {SHORTCUTS.map(({ action, keys }) => (
        <div key={action} className="flex items-center justify-between gap-4 text-sm">
          <span className="text-muted-foreground">{action}</span>
          <KbdGroup>
            {keys.map((key) => (
              <Kbd key={key}>{key}</Kbd>
            ))}
          </KbdGroup>
        </div>
      ))}
    </div>
  ),
});

/** Inline shortcut hint inside running prose. */
export const Group = meta.story({
  render: () => (
    <p className="text-sm text-muted-foreground">
      Use{" "}
      <KbdGroup>
        <Kbd>Ctrl + B</Kbd>
        <Kbd>Ctrl + K</Kbd>
      </KbdGroup>{" "}
      to open the command palette
    </p>
  ),
});

/** A key embedded inside a button, demonstrating the tooltip/surface-aware styling. */
export const InButton = meta.story({
  render: () => (
    <Button variant="outline">
      Accept{" "}
      <Kbd className="translate-x-0.5" data-icon="inline-end">
        ⏎
      </Kbd>
    </Button>
  ),
});
