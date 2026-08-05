import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";

import type { RequestOutcome } from "#/features/inspector/server/run-request";

interface OutcomeSummaryProps {
  outcome: RequestOutcome;
}

/** What the tenant actually got, and the evidence that the request had a container of its own. */
export function OutcomeSummary({ outcome }: OutcomeSummaryProps) {
  const { context, scope } = outcome;

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="text-base">Resolved for {context.tenant || "this tenant"}</CardTitle>
          <div className="flex gap-2">
            <Badge variant="outline">region:{context.region}</Badge>
            <Badge variant="outline">tier:{context.tier}</Badge>
            <Badge variant={outcome.blockedOn === undefined ? "secondary" : "destructive"}>
              {outcome.blockedOn === undefined ? scope.requestId : `blocked on ${outcome.blockedOn}`}
            </Badge>
          </div>
        </div>
        <CardDescription>
          The child container is discarded when the request ends, so a scoped service lives exactly as long as the
          request and the catalog above it is never rebuilt.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-3">
        {outcome.summary.map((item) => (
          <div className="space-y-1" key={item.label}>
            <p className="text-xs tracking-wide text-muted-foreground uppercase">{item.label}</p>
            <p className="font-mono text-sm">{item.value}</p>
          </div>
        ))}

        <div className="space-y-1 sm:col-span-3">
          <p className="text-xs tracking-wide text-muted-foreground uppercase">Scope proof</p>
          <p className="text-sm text-muted-foreground">
            Two resolves inside this one request — scoped gave{" "}
            <span className="font-medium text-foreground">{scope.scopedSame ? "one instance" : "two instances"}</span>,
            transient gave{" "}
            <span className="font-medium text-foreground">
              {scope.transientSame ? "one instance" : "two instances"}
            </span>
            . The singleton clock still reads <code className="font-mono text-xs">{scope.clockStartedAt}</code>.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
