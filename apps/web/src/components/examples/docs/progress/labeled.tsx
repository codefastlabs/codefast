import { Progress } from "@codefast/ui/progress";

const METRICS = [
  { label: "Storage", value: 72 },
  { label: "Bandwidth", value: 45 },
  { label: "API calls", value: 23 },
];

export function ProgressLabeled() {
  return (
    <div className="w-full max-w-xs space-y-4">
      {METRICS.map(({ label, value }) => (
        <div key={label} className="space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-ui-fg">{label}</span>
            <span className="text-ui-muted tabular-nums">{value}%</span>
          </div>
          <Progress value={value} />
        </div>
      ))}
    </div>
  );
}
