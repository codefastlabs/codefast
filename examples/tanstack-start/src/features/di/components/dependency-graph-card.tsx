import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Label } from "@codefast/ui/label";
import { Switch } from "@codefast/ui/switch";
import { useState } from "react";

import { DependencyGraph } from "#/features/di/components/dependency-graph";
import { GraphExport } from "#/features/di/components/graph-export";
import { SCOPE_ORDER, ScopeDot } from "#/features/di/components/scope-dot";
import type { GraphExports } from "#/features/di/server/tasks";

interface DependencyGraphCardProps {
  graph: ReactFlowGraph;
  graphExports: GraphExports;
  /** Fresh `container.validate()` result — runtime bind/unbind/rebind can change it. */
  validated: boolean;
}

/** One designed canvas for the request wiring, plus every adapter output as a portable source. */
export function DependencyGraphCard({ graph, graphExports, validated }: DependencyGraphCardProps) {
  const [showShadowed, setShowShadowed] = useState(false);

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Dependency graph</CardTitle>
          <Badge variant={validated ? "secondary" : "destructive"}>{validated ? "validated ✓" : "invalid ✗"}</Badge>
        </div>
        <CardDescription>
          The wiring that serves a request, from <code className="font-mono text-xs">generateDependencyGraph()</code>.
          Hover a binding to trace what it depends on; click it for details.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-end gap-2">
          <Switch checked={showShadowed} id="show-shadowed" onCheckedChange={setShowShadowed} />
          <Label className="text-xs font-normal text-muted-foreground" htmlFor="show-shadowed">
            Show shadowed root bindings
          </Label>
        </div>
        <DependencyGraph edges={graph.edges} nodes={graph.nodes} showShadowed={showShadowed} />
        <ul className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {SCOPE_ORDER.map((scope) => (
            <li className="flex items-center gap-1.5" key={scope}>
              <ScopeDot scope={scope} />
              {scope}
            </li>
          ))}
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-4 rounded-sm border border-dashed border-muted-foreground" />
            root chain
          </li>
          <li className="flex items-center gap-1.5">
            <span aria-hidden className="h-3 w-4 rounded-sm border border-dashed border-muted-foreground opacity-50" />
            optional, not bound
          </li>
          <li className="flex items-center gap-1.5">
            <svg aria-hidden className="h-1 w-5" viewBox="0 0 20 2">
              <line stroke="currentColor" strokeDasharray="4 3" strokeWidth="2" x1="0" x2="20" y1="1" y2="1" />
            </svg>
            optional edge
          </li>
        </ul>
        <div className="border-t border-border pt-3">
          <p className="mb-2 text-xs text-muted-foreground">
            Export — the same graph from <code className="font-mono">toDotGraph</code> /{" "}
            <code className="font-mono">toMermaidGraph</code> / <code className="font-mono">toCytoscapeGraph</code>,
            ready for your own tooling.
          </p>
          <GraphExport exports={graphExports} />
        </div>
      </CardContent>
    </Card>
  );
}
