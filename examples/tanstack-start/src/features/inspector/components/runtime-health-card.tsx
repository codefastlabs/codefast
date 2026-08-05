import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Separator } from "@codefast/ui/separator";
import { CircleCheckIcon, CircleXIcon, PackageIcon } from "lucide-react";

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

      <CardContent className="space-y-4 text-sm">
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <p className="font-medium">Async singleton, warmed at boot</p>
            <Badge variant="outline">{boot.revision}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            The pricing config can only answer asynchronously, so a sync resolve fails until something awaits it. Both
            sides of that are run on every request against two containers with the identical binding:
          </p>
          <dl className="grid gap-1 font-mono text-xs">
            <div className="flex items-center gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">after initializeAsync</dt>
              <dd className="text-foreground">{boot.warmSyncResolve}</dd>
            </div>
            <div className="flex items-center gap-2">
              <dt className="w-40 shrink-0 text-muted-foreground">never warmed</dt>
              <dd className="text-destructive">{boot.coldSyncResolve}</dd>
            </div>
          </dl>
        </div>

        <Separator />

        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <PackageIcon aria-hidden className="size-4 text-muted-foreground" />
            <p className="font-medium">Modules loaded for this request</p>
            <Badge variant={modules.loaded.length === 0 ? "secondary" : "default"}>
              {modules.loaded.length === 0 ? "none" : modules.loaded.join(", ")}
            </Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Fraud screening is bought separately, so its binding arrives with a module rather than sitting behind an
            if-statement. <code className="font-mono">resolveOptional</code> is what the pipeline uses to cope either
            way — right now it answers <span className="font-mono text-foreground">{modules.riskCheck}</span>.
          </p>
        </div>

        <Separator />

        <div className="space-y-2">
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
          <p className="text-xs break-words text-muted-foreground">{validation.detail}</p>
          {validation.passed ? (
            <p className="text-xs text-muted-foreground">
              Turn on <span className="font-medium text-foreground">Introduce a captive dependency</span> to wire a
              singleton onto a request-scoped service and watch this catch it before any resolve does.
            </p>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
