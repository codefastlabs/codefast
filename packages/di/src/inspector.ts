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
  /** Human-readable token/constructor label that owns this binding row. */
  readonly registryKeyLabel: string;
  /** Stable binding identifier. */
  readonly bindingId: BindingIdentifier;
  /** Binding strategy kind. */
  readonly kind: Binding<unknown>["kind"];
  /** Declared binding scope. */
  readonly scope: BindingScope;
  /** Cache/materialization status at snapshot time. */
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
  /** Flat list of every visible binding row in the container hierarchy. */
  readonly bindings: readonly ContainerBindingSnapshot[];
};

/**
 * Canonical structured dependency graph returned by {@link Container.generateDependencyGraph}.
 */
export type ContainerGraphJson = {
  /** Graph nodes (same shape as snapshot rows). */
  nodes: ContainerBindingSnapshot[];
  /** Directed dependency edges between node binding ids. */
  edges: ReturnType<typeof collectStaticDependencyEdges>[number][];
};

/**
 * Read-only view of the container internals exposed to {@link ContainerInspector}.
 */
export type ContainerInspectorContext = {
  /** Enumerates every registry key visible to the inspector. */
  collectAllRegistryKeys(): readonly RegistryKey[];
  /** Returns bindings for a given key, including hierarchy lookup behavior. */
  lookupBindings(key: RegistryKey): readonly Binding<unknown>[] | undefined;
  /** Reports whether a binding currently has a cached scoped/singleton instance. */
  isBindingCached(binding: Binding<unknown>): boolean;
  /** Metadata reader used for static constructor/lifecycle analysis. */
  metadataReader: MetadataReader | undefined;
};

/**
 * Options for {@link Container.generateDependencyGraph}.
 */
export type GraphOptions = {
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
 * Reads the container's registry and scope-cache state to produce debug snapshots
 * and canonical dependency-graph output (`nodes` + `edges`).
 *
 * Constructed internally by the container; advanced consumers can also construct it
 * directly via the `@codefast/di/inspector` subpath export.
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
   * Builds the canonical JSON graph (`nodes` + `edges`).
   */
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
