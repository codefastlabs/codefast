import { Separator } from "@codefast/ui/separator";

const STATS = [
  { label: "Stars", value: "1.2k" },
  { label: "Forks", value: "318" },
  { label: "Issues", value: "27" },
];

export function SeparatorStats() {
  return (
    <div className="flex items-center gap-4 rounded-xl border border-ui-border px-5 py-4">
      {STATS.map((stat, index) => (
        <div key={stat.label} className="flex items-center gap-4">
          {index > 0 ? <Separator orientation="vertical" className="h-8" /> : null}
          <div className="text-center">
            <p className="text-lg font-semibold text-ui-fg tabular-nums">{stat.value}</p>
            <p className="text-xs text-ui-muted">{stat.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
