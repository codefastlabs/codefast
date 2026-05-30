import { cn } from "@codefast/tailwind-variants";
import { Progress } from "@codefast/ui/progress";

export function ProgressDemo() {
  return (
    <div className="w-full max-w-xs space-y-3">
      <div>
        <div className={cn("flex justify-between", "mb-1.5", "text-xs text-muted-foreground")}>
          <span>Uploading…</span>
          <span>68%</span>
        </div>
        <Progress value={68} />
      </div>
      <Progress value={33} className="**:data-[slot=progress-indicator]:bg-amber-500" />
      <Progress value={100} className="**:data-[slot=progress-indicator]:bg-emerald-500" />
    </div>
  );
}
