import { ProgressCircle } from "@codefast/ui/progress-circle";

const METRICS = [
  { label: "CPU", value: 38 },
  { label: "Memory", value: 64 },
  { label: "Disk", value: 82 },
];

export function ProgressCircleDashboard() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      {METRICS.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <ProgressCircle value={value} showValue />
          <span className="text-xs text-ui-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
