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
        bindings.push({
          registryKeyLabel: registryLabel,
          bindingId: binding.id,
          kind: binding.kind,
          scope: binding.scope,
          activationStatus: activationStatusFor(binding, (bindingArg) =>
            this.ctx.isBindingCached(bindingArg),
          ),
          hasConditionalConstraint: binding.constraint !== undefined,
        });
      }
    }

    return { bindings };
  }

  /**
   * Produces a Graphviz `digraph` string. Cycles are represented as ordinary edges (Graphviz handles cycles).
   */
  generateDotGraph(): string {
    const lines: string[] = ["digraph codefast_di {", "  rankdir=LR;"];
    const snapshot = this.getSnapshot();
    const declaredNodes = new Set<BindingIdentifier>();

    for (const row of snapshot.bindings) {
      declaredNodes.add(row.bindingId);
      const shape = nodeShapeForKind(row.kind);
      const constraintNote = row.hasConditionalConstraint ? "\\nwhen(...)" : "";
      const label = dotEscapeLabel(
        `${row.kind}\\n${row.registryKeyLabel}\\nscope=${row.scope}\\n${row.bindingId}\\n${row.activationStatus}${constraintNote}`,
      );
      lines.push(`  "${row.bindingId}" [shape=${shape}, label="${label}"];`);
    }

    const edgeSeen = new Set<string>();
    for (const registryKey of this.ctx.collectAllRegistryKeys()) {
      const list = this.ctx.lookupBindings(registryKey);
      if (list === undefined) {
        continue;
      }
      const pathStart = [registryKeyLabel(registryKey)];
      for (const consumer of list) {
        const edges = collectStaticDependencyEdges(
          consumer,
          (registryKey) => this.ctx.lookupBindings(registryKey),
          this.ctx.metadataReader,
          pathStart,
        );
        for (const edge of edges) {
          const edgeKey = `${edge.fromBindingId}->${edge.toBindingId}:${edge.edgeKind}`;
          if (edgeSeen.has(edgeKey)) {
            continue;
          }
          edgeSeen.add(edgeKey);
          if (!declaredNodes.has(edge.fromBindingId)) {
            declaredNodes.add(edge.fromBindingId);
            lines.push(
              `  "${edge.fromBindingId}" [shape=box, label="(unlisted ${edge.fromBindingId})"];`,
            );
          }
          if (!declaredNodes.has(edge.toBindingId)) {
            declaredNodes.add(edge.toBindingId);
            lines.push(
              `  "${edge.toBindingId}" [shape=box, label="(unlisted ${edge.toBindingId})"];`,
            );
          }
          const edgeLabel = dotEscapeLabel(
            edge.toBindingConditional ? `${edge.edgeKind}|conditional` : edge.edgeKind,
          );
          const pathLabel = dotEscapeLabel(edge.resolutionPath.join(" -> "));
          lines.push(
            `  "${edge.fromBindingId}" -> "${edge.toBindingId}" [label="${edgeLabel}", xlabel="${pathLabel}"];`,
          );
        }
      }
    }

    lines.push("}");
    return lines.join("\n");
  }
}
