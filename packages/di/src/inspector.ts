import type { Binding, BindingIdentifier, BindingScope } from "#/binding";
import { registryKeyLabel } from "#/binding-select";
import { collectStaticDependencyEdges } from "#/dependency-graph";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { RegistryKey } from "#/registry";

/**
 * Whether a singleton/scoped binding's instance is currently held in the scope cache.
 */
export type BindingActivationStatus = "cached" | "not-cached" | "transient";

/**
 * Per-binding row inside a {@link ContainerSnapshot}.
 */
export type ContainerBindingSnapshot = {
  readonly registryKeyLabel: string;
  readonly bindingId: BindingIdentifier;
  readonly kind: Binding<unknown>["kind"];
  readonly scope: BindingScope;
  readonly activationStatus: BindingActivationStatus;
  /**
   * True when {@link BindingBuilder.when} was used (runtime predicate; static graph may still show edges).
   */
  readonly hasConditionalConstraint: boolean;
  readonly moduleId?: string;
};

/**
 * Full debug snapshot returned by {@link Container.inspect}.
 */
export type ContainerSnapshot = {
  readonly bindings: readonly ContainerBindingSnapshot[];
};

/**
 * Structured dependency graph returned by {@link Container.generateDependencyGraph} with `format: "json"`.
 */
export type ContainerGraphJson = {
  nodes: ContainerBindingSnapshot[];
  edges: ReturnType<typeof collectStaticDependencyEdges>[number][];
};

/**
 * Read-only view of the container internals exposed to {@link ContainerInspector}.
 */
export type ContainerInspectorContext = {
  collectAllRegistryKeys(): readonly RegistryKey[];
  lookupBindings(key: RegistryKey): readonly Binding<unknown>[] | undefined;
  isBindingCached(binding: Binding<unknown>): boolean;
  metadataReader: MetadataReader | undefined;
};

/**
 * Options for {@link Container.generateDependencyGraph}.
 */
export type DotGraphOptions = {
  /**
   * When true, omit registry keys whose label starts with `CODEFAST_DI_` (framework-style tokens)
   * and any edges that would only connect hidden nodes.
   */
  readonly hideInternals?: boolean;
};

/**
 * Maps a binding's scope and cache state to a {@link BindingActivationStatus} label.
 */
function activationStatusFor(
  binding: Binding<unknown>,
  isCached: (bindingToCheck: Binding<unknown>) => boolean,
): BindingActivationStatus {
  if (binding.scope === "transient") {
    return "transient";
  }
  return isCached(binding) ? "cached" : "not-cached";
}

/**
 * Escapes a string for use as a DOT `label="..."` attribute value.
 */
function dotEscapeLabel(text: string): string {
  return text.replaceAll("\\", "\\\\").replaceAll('"', '\\"').replaceAll("\n", "\\n");
}

/**
 * Escapes a string for safe embedding inside a DOT HTML-label (`<...>`) table cell.
 */
function dotEscapeHtml(text: string): string {
  return text
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

/**
 * Returns the Graphviz node shape name for a given binding kind.
 */
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

/**
 * Returns DOT fill-color and style attributes that visually distinguish binding scopes.
 */
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

/**
 * Strips non-alphanumeric characters from a module name to produce a valid DOT subgraph identifier.
 */
function sanitizeClusterId(moduleName: string): string {
  return moduleName.replace(/[^0-9a-zA-Z_]/g, "_");
}

/**
 * Returns `true` when the label string belongs to a framework-internal registry key.
 */
function registryKeyLabelIsInternal(label: string): boolean {
  return label.startsWith("CODEFAST_DI_");
}

/**
 * Returns `true` when the registry key resolves to an internal framework label.
 */
function isInternalRegistryKey(key: RegistryKey): boolean {
  return registryKeyLabelIsInternal(registryKeyLabel(key));
}

/**
 * Read-only introspection and Graphviz DOT export for a container graph.
 */
/**
 * Reads the registry and scope-cache state to produce debug snapshots and dependency graphs.
 * Instantiated internally by the container; advanced consumers can construct it directly via
 * the `@codefast/di/inspector` subpath export.
 */
export class ContainerInspector {
  constructor(private readonly ctx: ContainerInspectorContext) {}

  /**
   * Collects all registered bindings into a flat, serialisable snapshot.
   */
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
   * Produces a Graphviz `digraph` string with HTML-label nodes and styled edges.
   * Cycles are represented as ordinary edges (Graphviz renders them correctly).
   * Pass `hideInternals: true` to suppress `CODEFAST_DI_`-prefixed tokens.
   */
  generateDotGraph(options?: DotGraphOptions): string {
    const hideInternals = options?.hideInternals === true;
    const fullSnapshot = this.getSnapshot();
    const visibleRows = hideInternals
      ? fullSnapshot.bindings.filter((row) => !registryKeyLabelIsInternal(row.registryKeyLabel))
      : fullSnapshot.bindings;
    const allowedBindingIds = new Set(visibleRows.map((row) => row.bindingId));

    const lines: string[] = [
      "digraph codefast_di {",
      "  rankdir=LR;",
      '  graph [fontname="Arial", fontsize=12, nodesep=0.8, ranksep=1.2];',
      '  node  [fontname="Arial", fontsize=12, shape=box, style="filled,rounded", fillcolor="#F5F5F5"];',
      '  edge  [fontname="Arial", fontsize=10];',
    ];

    const byModule = new Map<string | undefined, ContainerBindingSnapshot[]>();
    for (const row of visibleRows) {
      const key = row.moduleId;
      const moduleGroup = byModule.get(key);
      if (moduleGroup === undefined) {
        byModule.set(key, [row]);
      } else {
        moduleGroup.push(row);
      }
    }

    const clusteredEntries = [...byModule.entries()].filter(
      (entry): entry is [string, ContainerBindingSnapshot[]] => entry[0] !== undefined,
    );
    const unclustered = byModule.get(undefined) ?? [];

    const nodeAttributeLine = (row: ContainerBindingSnapshot, indent: string): string => {
      const shape = nodeShapeForKind(row.kind);
      const scopeAttrs = scopeVisualAttributes(row.scope);

      const kindText = dotEscapeHtml(row.kind);
      const nameText = dotEscapeHtml(row.registryKeyLabel);
      const scopeText = dotEscapeHtml(`scope=${row.scope}`);

      const whenRow = row.hasConditionalConstraint
        ? `      <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="9" COLOR="#666666">when(...)</FONT></TD></TR>\n`
        : "";

      const htmlLabel = [
        "<",
        '    <TABLE BORDER="0" CELLPADDING="4" CELLSPACING="0">',
        `      <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="9" COLOR="#666666">${kindText}</FONT></TD></TR>`,
        `      <TR><TD ALIGN="LEFT"><B>${nameText}</B></TD></TR>`,
        `      <TR><TD ALIGN="LEFT"><FONT POINT-SIZE="9">${scopeText}</FONT></TD></TR>`,
        whenRow.trimEnd(),
        "    </TABLE>",
        "  >",
      ]
        .filter((line) => line.length > 0)
        .join("\n");

      return `${indent}"${row.bindingId}" [shape=${shape}, ${scopeAttrs}, label=${htmlLabel}];`;
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
      for (const consumerBinding of list) {
        if (hideInternals && !allowedBindingIds.has(consumerBinding.id)) {
          continue;
        }
        const edges = collectStaticDependencyEdges(
          consumerBinding,
          (dependencyKey) => this.ctx.lookupBindings(dependencyKey),
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

  generateDependencyGraph(options?: DotGraphOptions & { format?: "dot" }): string;
  generateDependencyGraph(options: DotGraphOptions & { format: "json" }): ContainerGraphJson;
  generateDependencyGraph(
    options?: DotGraphOptions & { format?: "dot" | "json" },
  ): string | ContainerGraphJson {
    if (options?.format === "json") {
      return this.generateDependencyGraphJsonTyped(options);
    }
    return this.generateDotGraph(options);
  }

  generateDependencyGraphJsonTyped(options?: DotGraphOptions): ContainerGraphJson {
    const hideInternals = options?.hideInternals === true;
    const snapshot = this.getSnapshot();
    const visibleNodes = hideInternals
      ? snapshot.bindings.filter((row) => !registryKeyLabelIsInternal(row.registryKeyLabel))
      : [...snapshot.bindings];
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
      for (const consumerBinding of list) {
        if (hideInternals && !allowedBindingIds.has(consumerBinding.id)) {
          continue;
        }
        for (const edge of collectStaticDependencyEdges(
          consumerBinding,
          (dependencyKey) => this.ctx.lookupBindings(dependencyKey),
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
    return { nodes: visibleNodes, edges };
  }

  /**
   * Produces a JSON graph representation with `nodes` and `edges`.
   * @internal Use `generateDependencyGraph({ format: "json" })` for typed output.
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
      for (const consumerBinding of list) {
        if (hideInternals && !allowedBindingIds.has(consumerBinding.id)) {
          continue;
        }
        for (const edge of collectStaticDependencyEdges(
          consumerBinding,
          (dependencyKey) => this.ctx.lookupBindings(dependencyKey),
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
