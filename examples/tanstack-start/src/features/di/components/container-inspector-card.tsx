import { Badge } from "@codefast/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@codefast/ui/card";

import type { BindingInfo, TransientProof } from "#/features/di/server/tasks";

interface ContainerInspectorCardProps {
  bindings: Array<BindingInfo>;
  transientProof: TransientProof;
}

/** Every binding on the root container with its scope and kind, from `container.inspect()`. */
export function ContainerInspectorCard({ bindings, transientProof }: ContainerInspectorCardProps) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base">Container inspector</CardTitle>
          <Badge variant="secondary">{bindings.length} bindings</Badge>
        </div>
        <CardDescription>
          Serialized from <code className="font-mono text-xs">container.inspect()</code> — every binding on the root
          container with its scope and kind.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-border text-xs tracking-wide text-muted-foreground uppercase">
                <th className="py-2 pr-4 font-medium">Token</th>
                <th className="py-2 pr-4 font-medium">Scope</th>
                <th className="py-2 font-medium">Kind</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {bindings.map((binding, index) => (
                <tr key={`${binding.token}-${index}`}>
                  <td className="py-2 pr-4 font-mono text-xs">{binding.token}</td>
                  <td className="py-2 pr-4">
                    <Badge
                      variant={
                        binding.scope === "singleton"
                          ? "default"
                          : binding.scope === "transient"
                            ? "destructive"
                            : "secondary"
                      }
                    >
                      {binding.scope}
                    </Badge>
                  </td>
                  <td className="py-2 font-mono text-xs text-muted-foreground">{binding.kind}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="border-t border-border pt-3 text-xs text-muted-foreground">
          Transient <code className="font-mono">IdGenerator</code> — two resolves from one request gave{" "}
          <code className="font-mono">{transientProof.first}</code> and{" "}
          <code className="font-mono">{transientProof.second}</code> ({" "}
          {transientProof.distinct ? "distinct instances ✓" : "same instance ✗"} ).
        </p>
      </CardContent>
    </Card>
  );
}
