import { ProgressCircle } from "#/components/progress-circle";

import preview from "../.storybook/preview";

/**
 * ProgressCircle — a prop-driven leaf feedback component. The root owns every interesting
 * prop (`value`, `size`, `thickness`, `variant`, `showValue`, `strokeWidth`), so `{...args}`
 * drives the whole component. Content here is authored against the component's own public API
 * for Storybook, NOT synced with the apps/web registry.
 */
const meta = preview.meta({
  args: { showValue: true, size: "md", thickness: "regular", value: 72, variant: "default" },
  argTypes: {
    animate: { table: { disable: true } },
    animationDuration: { table: { disable: true } },
    classNames: { table: { disable: true } },
    customLabel: { table: { disable: true } },
    showValue: { control: "boolean" },
    size: { control: "select", options: ["sm", "md", "lg", "xl", "2xl"] },
    sizeInPixels: { table: { disable: true } },
    strokeWidth: { control: { type: "number", min: 1, max: 16, step: 1 } },
    thickness: { control: "radio", options: ["thin", "regular", "thick"] },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    variant: { control: "radio", options: ["default", "destructive"] },
  },
  component: ProgressCircle,
  parameters: {
    controls: { include: ["value", "size", "thickness", "variant", "showValue", "strokeWidth"] },
    docs: {
      description: {
        component:
          "A circular progress indicator that renders a 0–100 `value` as an arc, with an optional numeric label in the center. Size (`sm`–`2xl`), stroke `thickness`, and `variant` (default/destructive) are all root props, so every state below is just a different set of `args` on the same render.",
      },
    },
  },
  title: "Feedback/ProgressCircle",
});

export const Default = meta.story();

export const Destructive = meta.story({ args: { variant: "destructive" } });

export const Large = meta.story({ args: { size: "xl", value: 88 } });

export const Thick = meta.story({ args: { thickness: "thick", value: 45 } });

export const Complete = meta.story({ args: { value: 100 } });

/** A genuinely different composition: several values shown side by side. */
export const Values = meta.story({
  render: () => (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <ProgressCircle value={25} />
      <ProgressCircle value={50} />
      <ProgressCircle value={75} />
      <ProgressCircle value={100} showValue />
    </div>
  ),
});

const metrics = [
  { label: "CPU", value: 38 },
  { label: "Memory", value: 64 },
  { label: "Disk", value: 82 },
];

/** A genuinely different composition: labeled metric tiles. */
export const Dashboard = meta.story({
  render: () => (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {metrics.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <ProgressCircle value={value} showValue />
          <span className="text-xs text-muted-foreground">{label}</span>
        </div>
      ))}
    </div>
  ),
});
