import { Spinner } from "@codefast/ui/spinner";

export function SpinnerLabeled() {
  return (
    <div className="flex w-full max-w-xs flex-col items-center justify-center gap-3 rounded-xl border border-ui-border py-8">
      <Spinner className="size-6 text-ui-brand" />
      <p className="text-sm text-ui-muted">Loading your workspace…</p>
    </div>
  );
}
