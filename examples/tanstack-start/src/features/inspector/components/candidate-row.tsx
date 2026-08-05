import { Badge } from "@codefast/ui/badge";
import { cn } from "@codefast/ui/lib/utils";
import { CheckIcon, MinusIcon, ShieldQuestionMarkIcon } from "lucide-react";

import type { CandidateView } from "#/features/inspector/server/explain";

interface CandidateRowProps {
  candidate: CandidateView;
}

/** One binding the container weighed, and what it decided about it. */
export function CandidateRow({ candidate }: CandidateRowProps) {
  const { verdict } = candidate;
  const rejected = verdict.kind === "rejected";

  return (
    <li
      className={cn(
        "flex flex-wrap items-center gap-x-3 gap-y-1 rounded-md border px-3 py-2 text-sm transition-colors",
        candidate.won
          ? "border-primary/40 bg-primary/5"
          : rejected
            ? "border-transparent bg-muted/40 text-muted-foreground"
            : "border-border",
      )}
    >
      <span aria-hidden className={cn("shrink-0", candidate.won ? "text-primary" : "text-muted-foreground")}>
        {candidate.won ? (
          <CheckIcon className="size-4" />
        ) : verdict.kind === "guarded" ? (
          <ShieldQuestionMarkIcon className="size-4" />
        ) : (
          <MinusIcon className="size-4" />
        )}
      </span>

      <span className={cn("font-medium", rejected && "line-through decoration-muted-foreground/40")}>
        {candidate.label}
      </span>

      <code className="font-mono text-xs text-muted-foreground">{candidate.slotLabel}</code>

      <span className="ml-auto flex items-center gap-2">
        {verdict.kind === "rejected" ? (
          <span className="text-xs">{verdict.because}</span>
        ) : (
          <Badge variant="outline">
            {verdict.tagCount} {verdict.tagCount === 1 ? "tag" : "tags"}
          </Badge>
        )}
        {verdict.kind === "guarded" ? <span className="text-xs">guard: {verdict.guard}</span> : null}
        {candidate.won ? <Badge>selected</Badge> : null}
      </span>
    </li>
  );
}
