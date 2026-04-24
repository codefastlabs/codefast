import type { Binding, BindingIdentifier, BindingScope } from "#/binding";
import { registryKeyLabel } from "#/binding-select";
import { collectStaticDependencyEdges } from "#/dependency-graph";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { RegistryKey } from "#/registry";
export type BindingActivationStatus = "cached" | "not-cached" | "transient";
export type ContainerBindingSnapshot = {
  readonly registryKeyLabel: string;
  readonly bindingId: BindingIdentifier;
  readonly kind: Binding<unknown>["kind"];
  readonly scope: BindingScope;
  readonly activationStatus: BindingActivationStatus;
  readonly hasConditionalConstraint: boolean;
  readonly moduleId?: string;
};
export type ContainerSnapshot = {
  readonly bindings: readonly ContainerBindingSnapshot[];
};
export type ContainerGraphJson = {
  nodes: ContainerBindingSnapshot[];
  edges: ReturnType<typeof collectStaticDependencyEdges>[number][];
};
export type ContainerInspectorContext = {
  collectAllRegistryKeys(): readonly RegistryKey[];
  lookupBindings(key: RegistryKey): readonly Binding<unknown>[] | undefined;
  isBindingCached(binding: Binding<unknown>): boolean;
  metadataReader: MetadataReader | undefined;
};
export type GraphOptions = {
  readonly hideInternals?: boolean;
};
function activationStatusFor(
  binding: Binding<unknown>,
  isCached: (bindingToCheck: Binding<unknown>) => boolean,
): BindingActivationStatus {
  if (binding.scope === "transient") {
    return "transient";
  }
  return isCached(binding) ? "cached" : "not-cached";
}
function registryKeyLabelIsInternal(label: string): boolean {
  return label.startsWith("CODEFAST_DI_");
}
function isInternalRegistryKey(key: RegistryKey): boolean {
  return registryKeyLabelIsInternal(registryKeyLabel(key));
}
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
  generateDependencyGraph(options?: GraphOptions): ContainerGraphJson {
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
}
