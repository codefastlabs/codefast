import type { Meta, StoryObj } from "@storybook/react-vite";

import { Button } from "#/components/button";
import { Kbd, KbdGroup } from "#/components/kbd";

/**
 * Kbd is a composition with optional root props. Demoed via `render` while
 * keeping `component` bound to the Root (Pattern C, see Card).
 */
const meta = {
  component: Kbd,
  title: "Display/Kbd",
} satisfies Meta<typeof Kbd>;

export default meta;

type Story = StoryObj<typeof meta>;

const SHORTCUTS = [
  { action: "Open command palette", keys: ["⌘", "K"] },
  { action: "Save document", keys: ["⌘", "S"] },
  { action: "Toggle sidebar", keys: ["⌘", "B"] },
];

export const Default: Story = {
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
};

export const Group: Story = {
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
};

export const InButton: Story = {
  render: () => (
    <Button variant="outline">
      Accept{" "}
      <Kbd data-icon="inline-end" className="translate-x-0.5">
        ⏎
      </Kbd>
    </Button>
  ),
};
