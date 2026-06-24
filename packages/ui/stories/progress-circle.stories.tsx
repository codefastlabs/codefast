import { ProgressCircle } from "#/components/progress-circle";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { showValue: true, size: "md", thickness: "regular", value: 72, variant: "default" },
  argTypes: {
    showValue: { control: "boolean" },
    size: { control: "select", options: ["sm", "md", "lg", "xl", "2xl"] },
    strokeWidth: { control: { type: "number", min: 1, max: 16, step: 1 } },
    thickness: { control: "radio", options: ["thin", "regular", "thick"] },
    value: { control: { type: "range", min: 0, max: 100, step: 1 } },
    variant: { control: "radio", options: ["default", "destructive"] },
  },
  component: ProgressCircle,
  parameters: {
    controls: { include: ["value", "size", "thickness", "variant", "showValue", "strokeWidth"] },
  },
  title: "Feedback/ProgressCircle",
});

export const Default = meta.story();

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
