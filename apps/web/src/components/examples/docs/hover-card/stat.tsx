import { HoverCard, HoverCardContent, HoverCardTrigger } from "@codefast/ui/hover-card";

export function HoverCardStat() {
  return (
    <HoverCard>
      <HoverCardTrigger asChild>
        <button
          type="button"
          className="cursor-pointer rounded-lg border border-ui-border px-4 py-2 text-center"
        >
          <span className="block text-lg font-semibold text-ui-fg tabular-nums">2,847</span>
          <span className="text-xs text-ui-muted">Total stars</span>
        </button>
      </HoverCardTrigger>
      <HoverCardContent className="w-56">
        <p className="text-sm font-medium text-ui-fg">Last 30 days</p>
        <div className="mt-2 space-y-1 text-xs text-ui-muted">
          <div className="flex justify-between">
            <span>New stars</span>
            <span className="text-ui-fg tabular-nums">+312</span>
          </div>
          <div className="flex justify-between">
            <span>Daily average</span>
            <span className="text-ui-fg tabular-nums">10.4</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
}
