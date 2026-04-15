import type { Binding, BindingIdentifier, Constructor } from "#lib/binding";
import { registryKeyLabel, selectBindingForRegistry } from "#lib/binding-select";
import type { MetadataReader } from "#lib/decorators/metadata";
import { InvalidBindingError } from "#lib/errors";
import type { RegistryKey } from "#lib/registry";
import type { Token } from "#lib/token";

export type StaticDependencyEdge = {
  readonly fromBindingId: BindingIdentifier;
  readonly toBindingId: BindingIdentifier;
  readonly resolutionPath: readonly string[];
  readonly edgeKind: "sync" | "async";
  /** True when the resolved target binding carries a {@link BindingBuilder.when} predicate (runtime may skip this edge). */
  readonly toBindingConditional: boolean;
};

export type ResolvedDependency = {
  readonly binding: Binding<unknown>;
  readonly path: readonly string[];
};

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
      return [{ binding: effective, path: nextPath }];
    }
    case "resolved": {
      return consumer.dependencyTokens.map((tok) => {
        const label = registryKeyLabel(tok as Token<unknown> | Constructor<unknown>);
        const nextPath = [...pathPrefix, label];
        const binding = resolveDefaultBinding(lookup, tok, pathPrefix);
        if (binding === undefined) {
          throw new InvalidBindingError(
            `Missing binding for dependency "${label}" while building dependency graph (resolution path: ${nextPath.join(" -> ")})`,
          );
        }
        const effective = expandAliasChain(lookup, binding, nextPath);
        return { binding: effective, path: nextPath };
      });
    }
    case "class": {
      if (reader === undefined) {
        return [];
      }
      const meta = reader.getConstructorMetadata(consumer.ctor);
      if (meta === undefined || meta.parameters.length === 0) {
        return [];
      }
      return meta.parameters.flatMap((param) => {
        const tok = param.token;
        const label = registryKeyLabel(tok as Token<unknown> | Constructor<unknown>);
        const nextPath = [...pathPrefix, label];
        const binding = resolveDefaultBinding(lookup, tok, pathPrefix);
        if (binding === undefined) {
          if (param.optional) {
            return [];
          }
          throw new InvalidBindingError(
            `Missing binding for constructor parameter "${label}" while building dependency graph (resolution path: ${nextPath.join(" -> ")})`,
          );
        }
        const effective = expandAliasChain(lookup, binding, nextPath);
        return [{ binding: effective, path: nextPath }];
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
  return deps.map((dep) => ({
    fromBindingId: consumer.id,
    toBindingId: dep.binding.id,
    resolutionPath: dep.path,
    edgeKind: edgeKindFor(consumer, dep.binding),
    toBindingConditional: dep.binding.constraint !== undefined,
  }));
}
