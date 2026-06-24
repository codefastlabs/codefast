import { ProgressCircle } from "#/components/progress-circle";

import preview from "../.storybook/preview";

const meta = preview.meta({
  args: { showValue: true, value: 72 },
  component: ProgressCircle,
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
