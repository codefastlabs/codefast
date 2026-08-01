import { Tabs, TabsContent, TabsList, TabsTrigger } from "@codefast/ui/tabs";
import type { ReactElement } from "react";

import { CopyButton } from "#/features/di/components/copy-button";
import { GraphSource } from "#/features/di/components/graph-source";
import type { GraphExports } from "#/features/di/server/tasks";

interface GraphExportProps {
  exports: GraphExports;
}

/** Where each adapter's output is meant to be pasted. */
const DESTINATIONS = {
  dot: { label: "DOT", hint: "Graphviz / edotor.net" },
  mermaid: { label: "Mermaid", hint: "GitHub markdown / mermaid.live" },
  cytoscape: { label: "Cytoscape", hint: "cytoscape.js elements" },
  json: { label: "JSON", hint: "raw ContainerGraphJson" },
} as const satisfies Record<keyof GraphExports, { label: string; hint: string }>;

const FORMATS = Object.keys(DESTINATIONS) as Array<keyof GraphExports>;

/** The same graph as portable sources — take it to Graphviz, Mermaid, Cytoscape, or your own tooling. */
export function GraphExport({ exports }: GraphExportProps): ReactElement {
  return (
    <Tabs defaultValue="dot">
      <TabsList>
        {FORMATS.map((format) => (
          <TabsTrigger key={format} value={format}>
            {DESTINATIONS[format].label}
          </TabsTrigger>
        ))}
      </TabsList>
      {FORMATS.map((format) => (
        <TabsContent className="pt-2" key={format} value={format}>
          <div className="mb-2 flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{DESTINATIONS[format].hint}</span>
            <CopyButton value={exports[format]} />
          </div>
          <GraphSource source={exports[format]} />
        </TabsContent>
      ))}
    </Tabs>
  );
}
