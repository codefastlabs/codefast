import type { Binding, BindingIdentifier, BindingScope } from "#lib/binding";
import { registryKeyLabel } from "#lib/binding-select";
import { collectStaticDependencyEdges } from "#lib/dependency-graph";
import type { MetadataReader } from "#lib/decorators/metadata";
import type { RegistryKey } from "#lib/registry";

export type BindingActivationStatus = "cached" | "not-cached" | "transient";

export type ContainerBindingSnapshot = {
  readonly registryKeyLabel: string;
  readonly bindingId: BindingIdentifier;
  readonly kind: Binding<unknown>["kind"];
  readonly scope: BindingScope;
  readonly activationStatus: BindingActivationStatus;
  /** True when {@link BindingBuilder.when} was used (runtime predicate; static graph may still show edges). */
  readonly hasConditionalConstraint: boolean;
  readonly moduleId?: string;
};

export type ContainerSnapshot = {
  readonly bindings: readonly ContainerBindingSnapshot[];
};

export type ContainerInspectorContext = {
  collectAllRegistryKeys(): readonly RegistryKey[];
  lookupBindings(key: RegistryKey): readonly Binding<unknown>[] | undefined;
  isBindingCached(binding: Binding<unknown>): boolean;
  metadataReader: MetadataReader | undefined;
};

export type DotGraphOptions = {
  /**
   * When true, omit registry keys whose label starts with `CODEFAST_DI_` (framework-style tokens)
   * and any edges that would only connect hidden nodes.
   */
  readonly hideInternals?: boolean;
};

function activationStatusFor(
  binding: Binding<unknown>,
  isCached: (bindingArg: Binding<unknown>) => boolean,
): BindingActivationStatus {
  if (binding.scope === "transient") {
    return "transient";
  }
  return isCached(binding) ? "cached" : "not-cached";
}

function dotEscapeLabel(text: string): string {
  return text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
}

function nodeShapeForKind(kind: Binding<unknown>["kind"]): string {
  switch (kind) {
    case "constant":
      return "ellipse";
    case "class":
      return "box";
    case "dynamic":
    case "async-dynamic":
    case "resolved":
      return "diamond";
    case "alias":
      return "octagon";
    default: {
      const exhaustiveCheck: never = kind;
      return exhaustiveCheck;
    }
  }
}

function scopeVisualAttributes(scope: BindingScope): string {
  switch (scope) {
    case "singleton":
      return 'style="filled", fillcolor="#FFD700", penwidth=2';
    case "scoped":
      return 'style="filled", fillcolor="#ADD8E6"';
    case "transient":
      return 'style="dashed"';
    default: {
      const exhaustive: never = scope;
      return exhaustive;
    }
  }
}

function sanitizeClusterId(moduleName: string): string {
  return moduleName.replace(/[^0-9a-zA-Z_]/g, "_");
}

function registryKeyLabelIsInternal(label: string): boolean {
  return label.startsWith("CODEFAST_DI_");
}

function isInternalRegistryKey(key: RegistryKey): boolean {
  return registryKeyLabelIsInternal(registryKeyLabel(key));
}

/**
 * Read-only introspection and Graphviz DOT export for a container graph.
 */
export class ContainerInspector {
  constructor(private readonly ctx: ContainerInspectorContext) {}

  getSnapshot(): ContainerSnapshot {
    const bindings: ContainerBindingSnapshot[] = [];
    const seen = new Set<BindingIdentifier>();

    for (const registryKey of this.ctx.collectAllRegistryKeys()) {
      const list = this.ctx.lookupBindings(registryKey);
      if (list === undefined || list.length === 0) {
        continue;
      }
      const registryLabel = registryKeyLabel(registryKey);
      for (const binding of list) {
        if (seen.has(binding.id)) {
          continue;
        }
        seen.add(binding.id);
        const row: ContainerBindingSnapshot = {
          registryKeyLabel: registryLabel,
          bindingId: binding.id,
          kind: binding.kind,
          scope: binding.scope,
          activationStatus: activationStatusFor(binding, (bindingArg) =>
            this.ctx.isBindingCached(bindingArg),
          ),
          hasConditionalConstraint: binding.constraint !== undefined,
        };
        bindings.push(
          binding.moduleId === undefined ? row : { ...row, moduleId: binding.moduleId },
        );
      }
    }

    return { bindings };
  }

  /**
   * Produces a Graphviz `digraph` string. Cycles are represented as ordinary edges (Graphviz handles cycles).
   */
  generateDotGraph(options?: DotGraphOptions): string {
    const hideInternals = options?.hideInternals === true;
    const fullSnapshot = this.getSnapshot();
    const visibleRows = hideInternals
      ? fullSnapshot.bindings.filter((row) => !registryKeyLabelIsInternal(row.registryKeyLabel))
      : fullSnapshot.bindings;
    const allowedBindingIds = new Set(visibleRows.map((row) => row.bindingId));

    const lines: string[] = ["digraph codefast_di {", "  rankdir=LR;"];

    const byModule = new Map<string | undefined, ContainerBindingSnapshot[]>();
    for (const row of visibleRows) {
      const key = row.moduleId;
      const bucket = byModule.get(key);
      if (bucket === undefined) {
        byModule.set(key, [row]);
      } else {
        bucket.push(row);
      }
    }

    const clusteredEntries = [...byModule.entries()].filter(
      (entry): entry is [string, ContainerBindingSnapshot[]] => entry[0] !== undefined,
    );
    const unclustered = byModule.get(undefined) ?? [];

    const nodeAttributeLine = (row: ContainerBindingSnapshot, indent: string): string => {
      const shape = nodeShapeForKind(row.kind);
      const scopeAttrs = scopeVisualAttributes(row.scope);
      const constraintNote = row.hasConditionalConstraint ? "\\nwhen(...)" : "";
      const label = dotEscapeLabel(
        `${row.kind}\\n${row.registryKeyLabel}\\nscope=${row.scope}\\n${row.bindingId}\\n${row.activationStatus}${constraintNote}`,
      );
      return `${indent}"${row.bindingId}" [shape=${shape}, ${scopeAttrs}, label="${label}"];`;
    };

    for (const [moduleName, rows] of clusteredEntries) {
      const clusterId = sanitizeClusterId(moduleName);
      lines.push(`  subgraph cluster_${clusterId} {`);
      lines.push(`    label="${dotEscapeLabel(moduleName)}";`);
      lines.push(`    style=filled;`);
      lines.push(`    fillcolor=lightgray;`);
      for (const row of rows) {
        lines.push(nodeAttributeLine(row, "    "));
      }
      lines.push(`  }`);
    }

    for (const row of unclustered) {
      lines.push(nodeAttributeLine(row, "  "));
    }

    const emittedNodeIds = new Set(visibleRows.map((row) => row.bindingId));
    const edgeSeen = new Set<string>();
    for (const registryKey of this.ctx.collectAllRegistryKeys()) {
      if (hideInternals && isInternalRegistryKey(registryKey)) {
        continue;
      }
      const list = this.ctx.lookupBindings(registryKey);
      if (list === undefined) {
        continue;
      }
      const pathStart = [registryKeyLabel(registryKey)];
      for (const consumer of list) {
        if (hideInternals && !allowedBindingIds.has(consumer.id)) {
          continue;
        }
        const edges = collectStaticDependencyEdges(
          consumer,
          (registryKeyArg) => this.ctx.lookupBindings(registryKeyArg),
          this.ctx.metadataReader,
          pathStart,
        );
        for (const edge of edges) {
          if (
            hideInternals &&
            (!allowedBindingIds.has(edge.fromBindingId) || !allowedBindingIds.has(edge.toBindingId))
          ) {
            continue;
          }
          const edgeKey = `${edge.fromBindingId}->${edge.toBindingId}:${edge.edgeKind}:${edge.injectHintLabel ?? ""}`;
          if (edgeSeen.has(edgeKey)) {
            continue;
          }
          edgeSeen.add(edgeKey);

          if (!emittedNodeIds.has(edge.fromBindingId)) {
            emittedNodeIds.add(edge.fromBindingId);
            lines.push(
              `  "${edge.fromBindingId}" [shape=box, style=dashed, label="(unlisted ${edge.fromBindingId})"];`,
            );
          }
          if (!emittedNodeIds.has(edge.toBindingId)) {
            emittedNodeIds.add(edge.toBindingId);
            lines.push(
              `  "${edge.toBindingId}" [shape=box, style=dashed, label="(unlisted ${edge.toBindingId})"];`,
            );
          }

          const labelParts: string[] = [];
          if (edge.injectHintLabel !== undefined) {
            labelParts.push(edge.injectHintLabel);
          }
          labelParts.push(edge.edgeKind);
          if (edge.toBindingConditional) {
            labelParts.push("conditional");
          }
          const edgeLabel = dotEscapeLabel(labelParts.join(" | "));
          const pathLabel = dotEscapeLabel(edge.resolutionPath.join(" -> "));
          const edgeStyle = edge.isAliasEdge ? ", style=dashed" : "";
          lines.push(
            `  "${edge.fromBindingId}" -> "${edge.toBindingId}" [label="${edgeLabel}", xlabel="${pathLabel}"${edgeStyle}];`,
          );
        }
      }
    }

    lines.push("}");
    return lines.join("\n");
  }

  /**
   * Produces a JSON graph representation with `nodes` and `edges`.
   */
  generateDependencyGraphJson(options?: DotGraphOptions): string {
    const hideInternals = options?.hideInternals === true;
    const snapshot = this.getSnapshot();
    const visibleNodes = hideInternals
      ? snapshot.bindings.filter((row) => !registryKeyLabelIsInternal(row.registryKeyLabel))
      : snapshot.bindings;
    const allowedBindingIds = new Set(visibleNodes.map((row) => row.bindingId));
    const edges: ReturnType<typeof collectStaticDependencyEdges>[number][] = [];
    const edgeSeen = new Set<string>();
    for (const registryKey of this.ctx.collectAllRegistryKeys()) {
      if (hideInternals && isInternalRegistryKey(registryKey)) {
        continue;
      }
      const list = this.ctx.lookupBindings(registryKey);
      if (list === undefined) {
        continue;
      }
      const pathStart = [registryKeyLabel(registryKey)];
      for (const consumer of list) {
        if (hideInternals && !allowedBindingIds.has(consumer.id)) {
          continue;
        }
        for (const edge of collectStaticDependencyEdges(
          consumer,
          (registryKeyArg) => this.ctx.lookupBindings(registryKeyArg),
          this.ctx.metadataReader,
          pathStart,
        )) {
          if (
            hideInternals &&
            (!allowedBindingIds.has(edge.fromBindingId) || !allowedBindingIds.has(edge.toBindingId))
          ) {
            continue;
          }
          const edgeKey = `${edge.fromBindingId}->${edge.toBindingId}:${edge.edgeKind}:${edge.injectHintLabel ?? ""}`;
          if (edgeSeen.has(edgeKey)) {
            continue;
          }
          edgeSeen.add(edgeKey);
          edges.push(edge);
        }
      }
    }
    return JSON.stringify({ nodes: visibleNodes, edges });
  }
}
