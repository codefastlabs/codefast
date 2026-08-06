import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { CircleCheckIcon, CircleXIcon, PackageIcon, TriangleAlertIcon } from "lucide-react";

import type { RequestOutcome } from "#/features/inspector/server/run-request";

interface RuntimeHealthCardProps {
  outcome: RequestOutcome;
}

/** What boot bought the request, what the flags loaded into it, and what `validate()` made of it. */
export function RuntimeHealthCard({ outcome }: RuntimeHealthCardProps) {
  const { boot, modules, validation } = outcome;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Runtime health</CardTitle>
        <CardDescription>
          Warm-up and validation are container-level concerns: they happen once at boot and once per request, not per
          slot.
        </CardDescription>
      </CardHeader>

      <CardContent className="grid gap-8 text-sm lg:grid-cols-3">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {boot.asExpected ? (
              <CircleCheckIcon aria-hidden className="size-4 text-primary" />
            ) : (
              <TriangleAlertIcon aria-hidden className="size-4 text-destructive" />
            )}
            <p className="font-medium">Async singleton, warmed at boot</p>
            <Badge variant={boot.asExpected ? "secondary" : "destructive"}>
              {boot.asExpected ? "both as expected" : "unexpected"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            The pricing config can only answer asynchronously, so a sync resolve of it <em>must</em> fail until
            something awaits it. Both outcomes below are the required ones — the second is the evidence, not a fault:
          </p>
          <dl className="grid gap-2 font-mono text-xs">
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <dt className="min-w-0 shrink text-muted-foreground">after initializeAsync</dt>
              <dd className="text-foreground">{boot.warmSyncResolve}</dd>
            </div>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <dt className="min-w-0 shrink text-muted-foreground">never warmed</dt>
              <dd className={boot.asExpected ? "text-foreground" : "text-destructive"}>
                {boot.coldSyncResolve}
                {boot.asExpected ? <span className="ml-2 text-muted-foreground">— as it must</span> : null}
              </dd>
            </div>
          </dl>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <PackageIcon aria-hidden className="size-4 text-muted-foreground" />
            <p className="font-medium">Modules loaded for this request</p>
            <Badge variant={modules.loaded.length === 0 ? "secondary" : "default"}>
              {modules.loaded.length === 0 ? "none" : modules.loaded.join(", ")}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Fraud screening is bought separately, so its binding arrives with a module rather than sitting behind an
            if-statement. <code className="font-mono">resolveOptional</code> is what the pipeline uses to cope either
            way — right now it answers <span className="font-mono text-foreground">{modules.riskCheck}</span>.
          </p>
        </div>

        <div className="space-y-3">
          <div className="flex items-center gap-2">
            {validation.passed ? (
              <CircleCheckIcon aria-hidden className="size-4 text-primary" />
            ) : (
              <CircleXIcon aria-hidden className="size-4 text-destructive" />
            )}
            <p className="font-medium">validate()</p>
            <Badge variant={validation.passed ? "secondary" : "destructive"}>
              {validation.passed ? "passed" : "scope violation"}
            </Badge>
          </div>
          <p className="text-sm break-words text-muted-foreground">{validation.detail}</p>
          {validation.passed ? (
            <p className="text-sm text-muted-foreground">
              Turn on <span className="font-medium text-foreground">Introduce a captive dependency</span> to wire a
              singleton onto a request-scoped service and watch this catch it before any resolve does.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
