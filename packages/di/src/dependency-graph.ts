import type { Binding, BindingIdentifier, Constructor, ResolveHint } from "#/binding";
import { registryKeyLabel, selectBindingForRegistry } from "#/binding-select";
import type { MetadataReader } from "#/decorators/metadata";
import { DiError } from "#/errors";
import type { RegistryKey } from "#/registry";
import type { Token } from "#/token";

export type StaticDependencyEdge = {
  readonly fromBindingId: BindingIdentifier;
  readonly toBindingId: BindingIdentifier;
  readonly resolutionPath: readonly string[];
  readonly edgeKind: "sync" | "async";
  /** True when the resolved target binding carries a {@link BindingBuilder.when} predicate (runtime may skip this edge). */
  readonly toBindingConditional: boolean;
  /** Constructor inject hint for this edge (named / tagged), when known statically. */
  readonly injectHintLabel?: string;
  /** True when the consumer binding is an alias (rebind to another token). */
  readonly isAliasEdge: boolean;
};

export type ResolvedDependency = {
  readonly binding: Binding<unknown>;
  readonly path: readonly string[];
  readonly injectHintLabel?: string;
};

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

function edgeKindFor(consumer: Binding<unknown>, dependency: Binding<unknown>): "sync" | "async" {
  if (consumer.kind === "async-dynamic" || dependency.kind === "async-dynamic") {
    return "async";
  }
  return "sync";
}

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
 * Lists direct static dependencies (constructor metadata, `toResolved` tokens, alias targets).
 * Factories (`toDynamic` / `toAsyncDynamic`) have no enumerable dependency keys.
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
          throw new DiError(
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
        const binding = resolveDefaultBinding(lookup, tok, pathPrefix);
        if (binding === undefined) {
          if (param.optional) {
            return [];
          }
          throw new DiError(
            `Missing binding for constructor parameter "${label}" while building dependency graph (resolution path: ${nextPath.join(" -> ")})`,
          );
        }
        const effective = expandAliasChain(lookup, binding, nextPath);
        const injectHintLabel = injectHintLabelFromResolveHint(
          param.name !== undefined
            ? { name: param.name }
            : param.tag !== undefined
              ? { tag: param.tag }
              : undefined,
        );
        return [{ binding: effective, path: nextPath, injectHintLabel }];
      });
    }
    default: {
      const exhaustiveCheck: never = consumer;
      return exhaustiveCheck;
    }
  }
}

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
    toBindingConditional: dep.binding.constraint !== undefined,
    injectHintLabel: dep.injectHintLabel,
    isAliasEdge,
  }));
}
