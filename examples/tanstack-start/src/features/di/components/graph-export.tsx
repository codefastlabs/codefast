import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import type { ReactElement } from "react";

import { CopyButton } from "#/features/di/components/copy-button";
import { GraphSource } from "#/features/di/components/graph-source";

interface GraphExportProps {
  graphDot: string;
  graphMermaid: string;
  graphCytoscape: string;
  graphJson: string;
}

/** The same graph as portable sources — take it to Graphviz, Mermaid, Cytoscape, or your own tooling. */
export function GraphExport({ graphDot, graphMermaid, graphCytoscape, graphJson }: GraphExportProps): ReactElement {
  const formats = [
    { value: "dot", label: "DOT", source: graphDot, hint: "Graphviz / edotor.net" },
    { value: "mermaid", label: "Mermaid", source: graphMermaid, hint: "GitHub markdown / mermaid.live" },
    { value: "cytoscape", label: "Cytoscape", source: graphCytoscape, hint: "cytoscape.js elements" },
    { value: "json", label: "JSON", source: graphJson, hint: "raw ContainerGraphJson" },
  ];

  return (
    <Tabs defaultValue="dot">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <TabsList>
          {formats.map((format) => (
            <TabsTrigger key={format.value} value={format.value}>
              {format.label}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>
      {formats.map((format) => (
        <TabsContent className="pt-2" key={format.value} value={format.value}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{format.hint}</span>
            <CopyButton value={format.source} />
          </div>
          <GraphSource source={format.source} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
