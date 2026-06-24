import { Button } from "#/components/button";
import { Kbd, KbdGroup } from "#/components/kbd";

import preview from "../.storybook/preview";

/**
 * Kbd is a composition with optional root props. Demoed via `render` while
 * keeping `component` bound to the Root (Pattern C, see Card).
 */
const meta = preview.meta({
  args: { children: "⌘" },
  argTypes: {
    children: { control: "text" },
  },
  component: Kbd,
  subcomponents: { KbdGroup },
  parameters: {
    controls: { include: ["children"] },
    docs: {
      description: {
        component: [
          "Displays a keyboard key or shortcut as inline text.",
          "",
          "**Anatomy:** `Kbd` for a single key, or `KbdGroup > Kbd…` to compose a multi-key shortcut.",
          "Renders semantic `<kbd>` elements and adapts its styling inside tooltips.",
        ].join("\n"),
      },
    },
  },
  title: "Display/Kbd",
});

const SHORTCUTS = [
  { action: "Open command palette", keys: ["⌘", "K"] },
  { action: "Save document", keys: ["⌘", "S"] },
  { action: "Toggle sidebar", keys: ["⌘", "B"] },
];

export const Default = meta.story();

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

export const InButton = meta.story({
  render: () => (
    <Button variant="outline">
      Accept{" "}
      <Kbd data-icon="inline-end" className="translate-x-0.5">
        ⏎
      </Kbd>
    </Button>
  ),
});
