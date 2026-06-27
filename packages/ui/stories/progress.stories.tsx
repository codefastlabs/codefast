import { Progress } from "#/components/progress";

import preview from "../.storybook/preview";

/**
 * Progress — a pure-display leaf whose root (Radix `Progress.Root`) owns the
 * single interesting prop: `value` (0–100). The filled indicator width is driven
 * entirely by that prop, so every visual state is just a different `value`.
 * Content here is authored for Storybook against the component's own public API,
 * not synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { value: 68 },
  argTypes: {
    max: { control: { type: "number" } },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
  },
  component: Progress,
  parameters: {
    controls: { include: ["value", "max"] },
    docs: {
      description: {
        component:
          "Displays an indicator showing the completion progress of a task, typically a determinate horizontal bar driven by `value` (0–100).",
      },
    },
  },
  render: (args) => (
    <div className="w-full max-w-xs">
      <Progress {...args} />
    </div>
  ),
  title: "Feedback/Progress",
});

export const Default = meta.story();

export const Complete = meta.story({
  args: { value: 100 },
});

export const Empty = meta.story({
  args: { value: 0 },
});

/** A genuinely different composition: pairs the bar with a caption + percentage label. */
export const WithLabel = meta.story({
  render: (args) => (
    <div className="w-full max-w-xs">
      <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
        <span>Uploading…</span>
        <span>{args.value ?? 0}%</span>
      </div>
      <Progress {...args} />
    </div>
  ),
});
