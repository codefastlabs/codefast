/**
 * The functions that check and describe a container without resolving from it.
 */
import type { Container } from "#container/container";
import { containerInternals } from "#container/container";
import type { Token } from "#core/token";
import type { Constructor } from "#core/types";
import type { ContainerGraphJson, GraphOptions } from "#introspection/dependency-graph";
import { buildDependencyGraph } from "#introspection/dependency-graph";
import type { ExplainOptions, ResolutionExplanation } from "#introspection/explanation";
import { explainRequest } from "#introspection/explanation";
import type { BindingSnapshot, ContainerSnapshot } from "#introspection/inspector";
import { validateChain } from "#introspection/validation";

/**
 * Checks a container's singleton graphs, lifecycle hooks and constraints without instantiating anything.
 *
 * @remarks A singleton graph is followed through its declared dependencies the way `resolve` would follow them, so
 * a missing binding, a cycle or a captive dependency fails here instead of on the first request.
 */
export function validate(container: Container): void {
  const internals = containerInternals(container);
  validateChain({
    registries: [internals.registry, ...internals.ancestorRegistries],
    resolver: internals.resolver,
    metadataReader: internals.metadataReader,
    hookedTokens: internals.lifecycle.hookedTokens(),
  });
}

/**
 * Describes a container: the bindings it registers itself, its cached singletons, and whether it has a parent and is
 * disposed.
 */
export function inspect(container: Container): ContainerSnapshot {
  return containerInternals(container).inspector().inspect();
}

/**
 * Describes the bindings a container registers itself for one token, ancestors excluded.
 */
export function lookupBindings<Value>(
  container: Container,
  token: Token<Value> | Constructor<Value>,
): ReadonlyArray<BindingSnapshot> {
  return containerInternals(container).inspector().lookupBindings(token);
}

/**
 * Explains why a request selects the binding it does, reading each registry the way `resolve` does and deciding by
 * the same rules, without instantiating anything.
 *
 * @remarks A `when()` predicate runs here as it would in `resolve`. `options.ancestors` names the resolutions the
 * request is nested in, so a predicate that reads the parent sees the one it would.
 */
export function explain<Names extends string = string>(
  container: Container,
  token: Token<unknown, Names> | Constructor,
  options?: NoInfer<ExplainOptions<Names>>,
): ResolutionExplanation {
  const { registry, ancestorRegistries } = containerInternals(container);
  return explainRequest([registry, ...ancestorRegistries], token, options);
}

/**
 * Builds the dependency graph of a container's own bindings, with the ancestors they resolve through.
 */
export function generateDependencyGraph(container: Container, options?: GraphOptions): ContainerGraphJson {
  const { registry, ancestorRegistries, metadataReader } = containerInternals(container);
  return buildDependencyGraph(registry, metadataReader, options, ancestorRegistries);
}
