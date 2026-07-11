import type { ReactFlowGraph } from "@codefast/di/graph-adapters/reactflow";
import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";

import { DependencyGraph } from "#/features/di/components/dependency-graph";

interface DependencyGraphCardProps {
  graph: ReactFlowGraph;
  graphDot: string;
}

/** React Flow visual + Graphviz DOT source, both from `generateDependencyGraph()`. */
export function DependencyGraphCard({ graph, graphDot }: DependencyGraphCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Dependency graph</CardTitle>
          <Badge variant="secondary">validated ✓</Badge>
        </div>
        <CardDescription>
          From <code className="font-mono text-xs">generateDependencyGraph()</code> — React Flow visual and Graphviz DOT
          source.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="graph">
          <TabsList>
            <TabsTrigger value="graph">Graph</TabsTrigger>
            <TabsTrigger value="dot">DOT</TabsTrigger>
          </TabsList>
          <TabsContent className="pt-3" value="graph">
            <DependencyGraph edges={graph.edges} nodes={graph.nodes} />
          </TabsContent>
          <TabsContent className="pt-3" value="dot">
            <pre className="h-[28rem] overflow-auto rounded-md border border-border bg-muted p-4 font-mono text-xs text-muted-foreground">
              {graphDot}
            </pre>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}
