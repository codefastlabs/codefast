import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { TriangleAlertIcon } from "lucide-react";

import { CandidateRow } from "#/features/inspector/components/candidate-row";
import type { Decision } from "#/features/inspector/server/explain";

interface DecisionCardProps {
  decision: Decision;
}

const RULE_COPY: Record<Decision["rule"], string> = {
  "sole candidate": "one binding matched the request, so there was nothing to weigh",
  predicate: "several matched and one carries a when() guard, so only the live resolve can settle it",
  "more tags": "several matched; the one declaring more of what the request named is the more specific",
  ambiguous: "several matched and none was more specific — the container refuses to guess",
  "no candidate": "no binding's slot could satisfy this request",
};

/** One slot, the request that hit it, every candidate weighed, and the rule that settled it. */
export function DecisionCard({ decision }: DecisionCardProps) {
  const requested =
    decision.request.tags.length === 0 && decision.request.name === undefined
      ? "no criterion"
      : [
          ...(decision.request.name === undefined ? [] : [`name: ${decision.request.name}`]),
          ...decision.request.tags.map(([key, value]) => `${key}: ${value}`),
        ].join(", ");

  return (
    <Card className={decision.error === undefined ? undefined : "border-destructive/50"}>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex flex-wrap items-center gap-2 font-mono text-base">
            {decision.token}
            {decision.via === undefined ? null : (
              <span className="text-xs font-normal text-muted-foreground">resolved inside {decision.via}</span>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            {decision.check === "disagrees" ? <Badge variant="destructive">trace disagreed with resolve</Badge> : null}
            {decision.check === "not predicted" ? <Badge variant="outline">settled at resolve time</Badge> : null}
            <Badge variant={decision.error === undefined ? "secondary" : "destructive"}>{decision.rule}</Badge>
          </div>
        </div>
        <CardDescription>
          asked for <code className="font-mono text-xs">{`{ ${requested} }`}</code>
          {decision.via === undefined
            ? " at the top level, so no parent frame exists for a guard to read"
            : ` as a dependency of ${decision.via}, so a guard reading the parent frame can fire`}{" "}
          — {RULE_COPY[decision.rule]}
        </CardDescription>
      </CardHeader>

      <CardContent className="space-y-3">
        <ul className="space-y-1.5">
          {decision.candidates.map((candidate) => (
            <CandidateRow candidate={candidate} key={candidate.label} />
          ))}
        </ul>

        {decision.error === undefined ? null : (
          <div className="flex gap-3 rounded-md border border-destructive/40 bg-destructive/5 px-3 py-2">
            <TriangleAlertIcon aria-hidden className="mt-0.5 size-4 shrink-0 text-destructive" />
            <div className="space-y-1 text-sm">
              <p className="font-medium">{decision.error.name}</p>
              <p className="text-xs text-muted-foreground">{decision.error.message}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
