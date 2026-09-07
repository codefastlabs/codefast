import { ProgressCircle } from "@codefast/ui/progress-circle";

const METRICS = [
  { label: "CPU", value: 38 },
  { label: "Memory", value: 72 },
  { label: "Disk", value: 91 },
];

export function ProgressCircleDemo() {
  return (
    <div className="flex items-center gap-8">
      {METRICS.map(({ label, value }) => (
        <div key={label} className="flex flex-col items-center gap-2">
          <ProgressCircle showValue value={value} />
          <span className="text-xs font-medium text-ui-muted">{label}</span>
        </div>
      ))}
    </div>
  );
}
