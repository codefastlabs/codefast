import { ProgressCircle } from "@codefast/ui/progress-circle";

export function ProgressCircleDemo() {
  return (
    <div className="flex flex-wrap items-center justify-center gap-6">
      <ProgressCircle value={25} />
      <ProgressCircle value={50} />
      <ProgressCircle value={75} />
      <ProgressCircle showValue value={90} />
    </div>
  );
}
