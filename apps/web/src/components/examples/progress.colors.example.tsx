import { Progress } from "@codefast/ui/progress";

const BARS = [
  { label: "Storage", value: 28, color: "**:data-[slot=progress-indicator]:bg-emerald-500" },
  { label: "Bandwidth", value: 64, color: "**:data-[slot=progress-indicator]:bg-amber-500" },
  { label: "Quota", value: 92, color: "**:data-[slot=progress-indicator]:bg-rose-500" },
];

export function ProgressColors() {
  return (
    <div className="w-full max-w-xs space-y-4">
      {BARS.map((bar) => (
        <div key={bar.label}>
          <div className="mb-1.5 flex justify-between text-xs text-ui-muted">
            <span>{bar.label}</span>
            <span className="tabular-nums">{bar.value}%</span>
          </div>
          <Progress value={bar.value} className={bar.color} />
        </div>
      ))}
    </div>
  );
}
