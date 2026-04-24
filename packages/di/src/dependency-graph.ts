/**
 * Static dependency-graph analysis for `@codefast/di`.
 *
 * This module walks binding metadata (constructor params, `toResolved` tokens, alias targets)
 * **without performing resolution** to produce typed graph edges. The output drives both
 * the Graphviz DOT renderer in {@link ContainerInspector} and the captive-dependency
 * validation performed internally by {@link Container.validate()}.
 *
 * "Static" means the graph is derived from declared metadata only — `toDynamic` / `toDynamicAsync`
 * factories have no enumerable keys and produce zero edges.
 *
 * @module
 */
import type { Binding, BindingIdentifier, Constructor, ResolveHint } from "#/binding";
import {
  filterMatchingBindings,
  registryKeyLabel,
  selectBindingForRegistry,
} from "#/binding-select";
import type { MetadataReader } from "#/metadata/metadata-types";
import { InternalError } from "#/errors";
import type { RegistryKey } from "#/registry";
import type { Token } from "#/token";

/**
 * A directed edge in the static dependency graph produced by {@link collectStaticDependencyEdges}.
 */
export type StaticDependencyEdge = {
  /** Binding id of the consumer node (edge source). */
  readonly fromBindingId: BindingIdentifier;
  /** Binding id of the dependency node (edge target). */
  readonly toBindingId: BindingIdentifier;
  /** Resolution labels leading to this edge. */
  readonly resolutionPath: readonly string[];
  /** Edge execution kind inferred from binding strategies. */
  readonly edgeKind: "sync" | "async";
  /**
   * True when the resolved target binding carries a {@link BindingBuilder.when} predicate (runtime may skip this edge).
   */
  readonly isToBindingConditional: boolean;
  /**
   * Constructor inject hint for this edge (named / tagged), when known statically.
   */
  readonly injectHintLabel?: string;
  /**
   * True when the consumer binding is an alias (rebind to another token).
   */
  readonly isAliasEdge: boolean;
};

/**
 * A single resolved dependency entry produced by {@link listResolvedDependencies}.
 */
export type ResolvedDependency = {
  /** Effective dependency binding selected for this edge. */
  readonly binding: Binding<unknown>;
  /** Resolution labels from consumer to dependency. */
  readonly path: readonly string[];
  /** Optional name/tag label shown in graph outputs. */
  readonly injectHintLabel?: string;
};

/**
 * Converts a tag value to a printable string for graph edge labels.
 */
function formatTagValueForGraph(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Converts a {@link ResolveHint} to a human-readable edge label for graph output (`name: x` / `tag: k=v`).
 */
export function injectHintLabelFromResolveHint(hint: ResolveHint | undefined): string | undefined {
  if (hint === undefined) {
    return undefined;
  }
  if (hint.name !== undefined) {
    return `name: ${hint.name}`;
  }
  if (hint.tag !== undefined) {
    const [tagKey, tagValue] = hint.tag;
    return `tag: ${tagKey}=${formatTagValueForGraph(tagValue)}`;
  }
  return undefined;
}

/**
 * Returns `"async"` when either the consumer or dependency binding is an `async-dynamic` factory.
 */
function edgeKindFor(consumer: Binding<unknown>, dependency: Binding<unknown>): "sync" | "async" {
  if (consumer.kind === "async-dynamic" || dependency.kind === "async-dynamic") {
    return "async";
  }
  return "sync";
}

/**
 * Resolves the default (first matching, no hint) binding for `depKey`.
 * Returns `undefined` when the key has no registered bindings.
 */
function resolveDefaultBinding(
  lookup: (key: RegistryKey) => readonly Binding<unknown>[] | undefined,
  depKey: RegistryKey,
  pathPrefix: readonly string[],
): Binding<unknown> | undefined {
  const label = registryKeyLabel(depKey as Token<unknown> | Constructor<unknown>);
  const nextPath = [...pathPrefix, label];
  const list = lookup(depKey);
  if (list === undefined || list.length === 0) {
    return undefined;
  }
  return selectBindingForRegistry(list, undefined, label, nextPath, undefined);
}

/**
 * Follows alias bindings until a non-alias binding is reached.
 * Returns the last reachable binding; stops early if an alias target is unregistered.
 *
 * **Warning:** This is a static walk with no cycle detection (`visiting` set). If the
 * registry contains a cyclic alias chain (A → B → A), this function will loop
 * indefinitely. The runtime resolver prevents such cycles via its own `visiting`
 * guard, but callers invoking `expandAliasChain` on a manually-constructed or
 * corrupted registry must ensure alias chains are acyclic.
 */
function expandAliasChain(
  lookup: (key: RegistryKey) => readonly Binding<unknown>[] | undefined,
  start: Binding<unknown>,
  pathPrefix: readonly string[],
): Binding<unknown> {
  let current = start;
  let path = pathPrefix;
  while (current.kind === "alias") {
    const next = resolveDefaultBinding(lookup, current.targetToken, path);
    if (next === undefined) {
      return current;
    }
    const label = registryKeyLabel(current.targetToken as Token<unknown> | Constructor<unknown>);
    path = [...path, label];
    current = next;
  }
  return current;
}

/**
 * Lists the direct static dependencies of `consumer` by inspecting binding metadata.
 *
 * - `constant` / `dynamic` / `async-dynamic` — no enumerable deps (empty array).
 * - `alias` — single dependency on the alias target (chased through alias chains).
 * - `resolved` — one dependency per entry in `dependencyTokens`; a missing binding
 *   always throws {@link InternalError} (there is no optional concept for `resolved`).
 * - `class` — one dependency per `@injectable()` constructor parameter
 *   (requires a {@link MetadataReader}). Parameters marked `optional` whose token
 *   has no binding are silently skipped; non-optional missing tokens throw
 *   {@link InternalError}.
 */
export function listResolvedDependencies(
  consumer: Binding<unknown>,
  lookup: (key: RegistryKey) => readonly Binding<unknown>[] | undefined,
  reader: MetadataReader | undefined,
  pathPrefix: readonly string[],
): readonly ResolvedDependency[] {
  switch (consumer.kind) {
    case "constant":
    case "dynamic":
    case "async-dynamic":
      return [];
    case "alias": {
      const binding = resolveDefaultBinding(lookup, consumer.targetToken, pathPrefix);
      if (binding === undefined) {
        return [];
      }
      const label = registryKeyLabel(consumer.targetToken as Token<unknown> | Constructor<unknown>);
      const nextPath = [...pathPrefix, label];
      const effective = expandAliasChain(lookup, binding, nextPath);
      return [{ binding: effective, path: nextPath, injectHintLabel: undefined }];
    }
    case "resolved": {
      return consumer.dependencyTokens.map((tok) => {
        const label = registryKeyLabel(tok as Token<unknown> | Constructor<unknown>);
        const nextPath = [...pathPrefix, label];
        const binding = resolveDefaultBinding(lookup, tok, pathPrefix);
        if (binding === undefined) {
          throw new InternalError(
            `Missing binding for dependency "${label}" while building dependency graph (resolution path: ${nextPath.join(" -> ")})`,
          );
        }
        const effective = expandAliasChain(lookup, binding, nextPath);
        return { binding: effective, path: nextPath, injectHintLabel: undefined };
      });
    }
    case "class": {
      if (reader === undefined) {
        return [];
      }
      const meta = reader.getConstructorMetadata(consumer.implementationClass);
      if (meta === undefined || meta.params.length === 0) {
        return [];
      }
      return meta.params.flatMap((param) => {
        const tok = param.token;
        const label = registryKeyLabel(tok as Token<unknown> | Constructor<unknown>);
        const nextPath = [...pathPrefix, label];
        const paramHint: ResolveHint | undefined =
          param.name !== undefined
            ? { name: param.name }
            : param.tag !== undefined
              ? { tag: param.tag }
              : undefined;

        if (param.isInjectAllBindings === true) {
          const bindings = lookup(tok as RegistryKey);
          if (bindings === undefined || bindings.length === 0) {
            return [];
          }
          const candidates = filterMatchingBindings(bindings, paramHint, undefined);
          if (candidates.length === 0) {
            return [];
          }
          return candidates.map((binding) => {
            const effective = expandAliasChain(lookup, binding, nextPath);
            return {
              binding: effective,
              path: nextPath,
              injectHintLabel: injectHintLabelFromResolveHint(paramHint),
            };
          });
        }

        const binding = resolveDefaultBinding(lookup, tok, pathPrefix);
        if (binding === undefined) {
          if (param.optional) {
            return [];
          }
          throw new InternalError(
            `Missing binding for constructor parameter "${label}" while building dependency graph (resolution path: ${nextPath.join(" -> ")})`,
          );
        }
        const effective = expandAliasChain(lookup, binding, nextPath);
        const injectHintLabel = injectHintLabelFromResolveHint(paramHint);
        return [{ binding: effective, path: nextPath, injectHintLabel }];
      });
    }
    default: {
      const exhaustiveCheck: never = consumer;
      return exhaustiveCheck;
    }
  }
}

/**
 * Flattens the direct dependencies of `consumer` into typed graph edges.
 * Used by {@link ContainerInspector} to build DOT and JSON outputs.
 */
export function collectStaticDependencyEdges(
  consumer: Binding<unknown>,
  lookup: (key: RegistryKey) => readonly Binding<unknown>[] | undefined,
  reader: MetadataReader | undefined,
  pathPrefix: readonly string[],
): readonly StaticDependencyEdge[] {
  const deps = listResolvedDependencies(consumer, lookup, reader, pathPrefix);
  const isAliasEdge = consumer.kind === "alias";
  return deps.map((dep) => ({
    fromBindingId: consumer.id,
    toBindingId: dep.binding.id,
    resolutionPath: dep.path,
    edgeKind: edgeKindFor(consumer, dep.binding),
    isToBindingConditional: dep.binding.constraint !== undefined,
    injectHintLabel: dep.injectHintLabel,
    isAliasEdge,
  }));
}
