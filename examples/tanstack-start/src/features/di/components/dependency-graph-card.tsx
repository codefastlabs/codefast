import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

import { DependencyGraph } from "#/features/di/components/dependency-graph";

interface DependencyGraphCardProps {
  graph: ReactFlowGraph;
  graphDot: string;
  graphMermaid: string;
  graphCytoscape: string;
  /** Fresh `container.validate()` result — runtime bind/unbind/rebind can change it. */
  validated: boolean;
}

/** Shared scrollable source block for the text-based adapter outputs. */
function GraphSource({ source }: { source: string }) {
  return (
    <pre className="h-[28rem] overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs text-muted-foreground">
      {source}
    </pre>
  );
}

/** One graph, every adapter: React Flow visual plus DOT, Mermaid, and Cytoscape sources. */
export function DependencyGraphCard({
  graph,
  graphDot,
  graphMermaid,
  graphCytoscape,
  validated,
}: DependencyGraphCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Dependency graph</CardTitle>
          <Badge variant={validated ? "secondary" : "destructive"}>{validated ? "validated ✓" : "invalid ✗"}</Badge>
        </div>
        <CardDescription>
          The request child&apos;s wiring via <code className="font-mono text-xs">generateDependencyGraph()</code> —
          child overrides plus the root chain, rendered by every graph adapter the package ships.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="graph">
          <TabsList>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="dot">DOT</TabsTrigger>
            <TabsTrigger value="mermaid">Mermaid</TabsTrigger>
            <TabsTrigger value="cytoscape">Cytoscape</TabsTrigger>
          </TabsList>
          <TabsContent className="pt-3" value="graph">
            <DependencyGraph edges={graph.edges} nodes={graph.nodes} />
          </TabsContent>
          <TabsContent className="pt-3" value="dot">
            <GraphSource source={graphDot} />
          </TabsContent>
          <TabsContent className="pt-3" value="mermaid">
            <GraphSource source={graphMermaid} />
          </TabsContent>
          <TabsContent className="pt-3" value="cytoscape">
            <GraphSource source={graphCytoscape} />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
