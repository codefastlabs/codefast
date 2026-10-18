/**
 * The static checks `validate` runs over a container's chain: singleton graphs, lifecycle hooks and constraints.
 */
import type { Binding } from "#core/binding";
import { bindingSlotToString, effectiveBindingScope } from "#core/binding";
import type { ConstraintRequirement } from "#core/constraint-requirement";
import { constraintRequirementsOf } from "#core/constraint-requirement";
import { getOrInsertComputed } from "#core/map-upsert";
import type { BindingRegistry } from "#core/registry";
import type { Token } from "#core/token";
import { tokenName } from "#core/token";
import type { BindingIdentifier, BindingScope, Constructor, DependencyKey, ResolveOptions } from "#core/types";
import {
  CircularDependencyError,
  InternalError,
  NoMatchingBindingError,
  ScopeViolationError,
  TokenNotBoundError,
  UnreachableConstraintError,
  UnreachableLifecycleHookError,
} from "#errors";
import type { DependencySlot } from "#injection/dependency-slot";
import { injectionSlotToResolveOptions } from "#injection/dependency-slot";
import type { LifecycleManager } from "#lifecycle/hooks";
import type { MetadataReader } from "#metadata/types";
import type { DefaultLookupEntry } from "#resolution/cache/lookup";
import type { DependencyResolver } from "#resolution/resolver";
import { matchesSlot } from "#resolution/select/candidates";

/**
 * What `validate` reads off a container.
 *
 * @remarks `registries` lists the container's own registry first, then each ancestor's, nearest first — the order
 * every chain walk reads them in.
 *
 * @since 0.14.0
 */
export interface ValidationTarget {
  readonly registries: readonly [BindingRegistry, ...ReadonlyArray<BindingRegistry>];
  readonly resolver: DependencyResolver;
  readonly metadataReader: MetadataReader;
  readonly lifecycle: Pick<LifecycleManager, "hookedTokens">;
}

/** One edge `validate` judges: the binding it reaches, and the resolver whose chain resolves that binding's own. */
interface ValidationEdge {
  readonly terminal: Binding;
  readonly owner: DependencyResolver;
  readonly depTokenName: string;
}

/** Where `validate` finds an alias chain ends: a terminal binding, or the token nothing selects and the hops to it. */
type AliasChainEnd =
  | { readonly found: true; readonly terminal: Binding; readonly owner: DependencyResolver }
  | {
      readonly found: false;
      readonly missingToken: Token<unknown> | Constructor;
      readonly hopNames: ReadonlyArray<string>;
    };

/**
 * Runs every static check over a container's chain, throwing the first error a resolve would meet.
 *
 * @throws `CircularDependencyError`, `ScopeViolationError`, `TokenNotBoundError` or `NoMatchingBindingError` for a
 * singleton graph that cannot resolve, `UnreachableLifecycleHookError` or `UnreachableConstraintError` for a hook or
 * constraint that can never fire.
 *
 * @since 0.14.0
 */
export function validateChain(target: ValidationTarget): void {
  // One pass over the bindings; the constrained ones wait for the hook check, so the errors keep their order.
  let constrained: Array<Binding> | undefined;
  for (const binding of target.registries[0].allBindings()) {
    if (isSingletonStaticAnalyzableBinding(binding)) {
      validateSingletonBindingGraph(binding, target.resolver, target.metadataReader);
    }
    if (binding.predicate !== undefined) {
      (constrained ??= []).push(binding);
    }
  }

  for (const [hookToken, phase] of target.lifecycle.hookedTokens()) {
    if (!isBoundInChain(target.registries, hookToken)) {
      throw new UnreachableLifecycleHookError(tokenName(hookToken), phase);
    }
    // A deactivation never runs for a transient, so a hook on a token whose every binding is transient
    // can never fire — the builder blocks it, `container.onDeactivation` cannot.
    if (phase === "onDeactivation" && !hasDeactivatableBindingInChain(target.registries, hookToken)) {
      throw new UnreachableLifecycleHookError(tokenName(hookToken), phase, "no-deactivatable-binding");
    }
  }

  if (constrained !== undefined) {
    validateConstraintRequirements(constrained, target.registries);
  }
}

/** A constraint waiting on a slot name no binding declares can never hold. */
function validateConstraintRequirements(
  constrained: ReadonlyArray<Binding>,
  registries: ReadonlyArray<BindingRegistry>,
): void {
  let declaredSlotNames: Map<string, Set<string>> | undefined;

  for (const binding of constrained) {
    const { predicate } = binding;
    if (predicate === undefined) {
      continue;
    }
    const requirements = constraintRequirementsOf(predicate);
    if (requirements.length === 0) {
      continue;
    }
    declaredSlotNames ??= slotNamesInChain(registries);
    for (const requirement of requirements) {
      if (!isSlotNameDeclared(declaredSlotNames, requirement)) {
        throw new UnreachableConstraintError(tokenName(binding.token), requirement);
      }
    }
  }
}

/** Every slot name declared anywhere a resolve through this container could reach, by declaring token. */
function slotNamesInChain(registries: ReadonlyArray<BindingRegistry>): Map<string, Set<string>> {
  const names = new Map<string, Set<string>>();
  for (const registry of registries) {
    for (const binding of registry.allBindings()) {
      const name = binding.slot.name;
      if (name !== undefined) {
        getOrInsertComputed(names, tokenName(binding.token), newSlotNameSet).add(name);
      }
    }
  }
  return names;
}

/** Hoisted so the slot-name index's `getOrInsertComputed` allocates only on a miss, no closure per call. */
const newSlotNameSet = (): Set<string> => new Set<string>();

/** Whether a requirement's name is declared — on its token when it names one, on any token otherwise. */
function isSlotNameDeclared(
  declared: ReadonlyMap<string, ReadonlySet<string>>,
  requirement: ConstraintRequirement,
): boolean {
  if (requirement.tokenName !== undefined) {
    return declared.get(requirement.tokenName)?.has(requirement.name) ?? false;
  }
  for (const names of declared.values()) {
    if (names.has(requirement.name)) {
      return true;
    }
  }
  return false;
}

// Ancestors count: a parent-owned binding is one this container can still resolve through.
function isBoundInChain(registries: ReadonlyArray<BindingRegistry>, token: DependencyKey): boolean {
  return registries.some((registry) => registry.has(token));
}

// Whether the token has a binding a deactivation hook can run for — anything but a transient.
function hasDeactivatableBindingInChain(registries: ReadonlyArray<BindingRegistry>, token: DependencyKey): boolean {
  return registries.some((registry) =>
    registry.getAll(token).some((binding) => effectiveBindingScope(binding) !== "transient"),
  );
}

function isSingletonStaticAnalyzableBinding(binding: Binding): boolean {
  if (effectiveBindingScope(binding) !== "singleton") {
    return false;
  }
  return binding.kind === "class" || binding.kind === "resolved" || binding.kind === "resolved-async";
}

/**
 * DFS over explicit constructor / `toResolved*` dependency edges, following `toAlias` chains to the terminal binding.
 *
 * @remarks Every binding reached is a singleton resolved from its owner's chain, so a required miss or a repeat
 * on one path fails however the graph is entered; a `toDynamic*` edge is scope-checked, its factory not descended.
 */
function validateSingletonBindingGraph(root: Binding, resolver: DependencyResolver, reader: MetadataReader): void {
  const rootName = tokenName(root.token);

  const dfs = (
    current: Binding,
    view: DependencyResolver,
    pathNames: Array<string>,
    pathBindingIds: Set<BindingIdentifier>,
  ): void => {
    if (pathBindingIds.has(current.identifier)) {
      throw new CircularDependencyError(pathNames);
    }
    const extendedPathIds = new Set(pathBindingIds);
    extendedPathIds.add(current.identifier);

    for (const edge of collectStaticDependencyEdges(current, view, reader, pathNames)) {
      const { terminal, owner, depTokenName } = edge;
      const depScope = validationScopeFromTerminal(terminal);
      if (depScope !== "singleton") {
        throw new ScopeViolationError({
          consumerToken: rootName,
          consumerScope: "singleton",
          dependencyToken: depTokenName,
          dependencyScope: depScope,
          path: [...pathNames, depTokenName],
        });
      }
      if (terminal.kind === "class" || terminal.kind === "resolved" || terminal.kind === "resolved-async") {
        dfs(terminal, owner, [...pathNames, depTokenName], extendedPathIds);
      }
    }
  };

  dfs(root, resolver, [rootName], new Set());
}

/**
 * The scope this edge is judged against.
 *
 * @remarks A factory's *body* is not statically analyzable, but the scope it was bound with is
 * declared like any other — so the captive-dependency check applies to it too. The DFS still
 * refuses to descend into a factory; only the edge is judged.
 */
function validationScopeFromTerminal(terminal: Binding): BindingScope {
  if (terminal.kind === "alias") {
    throw new InternalError("validate: expected terminal binding after alias resolution");
  }
  return terminal.scope;
}

/** Where an alias chain ends as `resolve` walks it from `view`: its terminal binding, or the names up to a miss. */
function followAliasChainToTerminal(
  entry: DefaultLookupEntry<DependencyResolver>,
  view: DependencyResolver,
  options: ResolveOptions | undefined,
): AliasChainEnd {
  const cyclePath: Array<string> = [];
  const seenAliasIds = new Set<BindingIdentifier>();
  let current = entry;

  while (current.binding.kind === "alias") {
    const alias = current.binding;
    if (seenAliasIds.has(alias.identifier)) {
      throw new CircularDependencyError(cyclePath);
    }
    seenAliasIds.add(alias.identifier);
    cyclePath.push(tokenName(alias.token));
    const next = view.peekBindingForValidate(alias.target, options);
    if (next === undefined) {
      return { found: false, missingToken: alias.target, hopNames: cyclePath };
    }
    current = next;
  }
  return { found: true, terminal: current.binding, owner: current.owner };
}

/** What one dependency could resolve to from `view`: every candidate for `injectAll`, else at most one. */
function peekDependencyCandidates(
  dep: DependencySlot,
  view: DependencyResolver,
  options: ResolveOptions | undefined,
): ReadonlyArray<DefaultLookupEntry<DependencyResolver>> {
  if (dep.multi) {
    return view
      .peekCandidateBindingsForValidate(dep.token, options)
      .map((binding) => ({ binding, owner: view.ownerForValidate(binding) }));
  }
  const found = view.peekBindingForValidate(dep.token, options);
  return found === undefined ? [] : [found];
}

/** What a binding declares up front — a class's params, a factory's descriptors, else nothing. */
function staticDependencies(binding: Binding, reader: MetadataReader): ReadonlyArray<DependencySlot> {
  if (binding.kind === "class") {
    return reader.getConstructorMetadata(binding.target)?.params ?? [];
  }
  if (binding.kind === "resolved" || binding.kind === "resolved-async") {
    return binding.deps;
  }
  return [];
}

/**
 * The error `resolve` raises for a request nothing selects, or `undefined` while a `when()` candidate leaves it open.
 *
 * @remarks A predicate reads the resolution path, which a static walk does not have, so a slot-matching candidate
 * that carries one may still be selected when the request is really made.
 */
function missForValidate(
  view: DependencyResolver,
  token: Token<unknown> | Constructor,
  options: ResolveOptions | undefined,
  path: ReadonlyArray<string>,
): TokenNotBoundError | NoMatchingBindingError | undefined {
  const bound = view.bindingsForValidate(token);
  if (bound.length === 0) {
    return new TokenNotBoundError(tokenName(token), path);
  }
  for (const binding of bound) {
    if (binding.predicate !== undefined && !binding.isMany && matchesSlot(binding.slot, options)) {
      return undefined;
    }
  }
  return new NoMatchingBindingError(
    tokenName(token),
    options ?? {},
    bound.map((binding) => bindingSlotToString(binding.slot)),
    path,
  );
}

/**
 * The bindings a singleton's declared dependencies resolve to, throwing the error `resolve` would for a required one
 * nothing selects.
 */
function collectStaticDependencyEdges(
  binding: Binding,
  view: DependencyResolver,
  reader: MetadataReader,
  pathNames: ReadonlyArray<string>,
): Array<ValidationEdge> {
  const edges: Array<ValidationEdge> = [];

  for (const dep of staticDependencies(binding, reader)) {
    // An optional dependency that is absent peeks no candidate; one that is bound is captured like any other.
    const depOptions = injectionSlotToResolveOptions(dep);
    // A collection may be empty and an optional dependency absent, so only a required one can miss.
    const required = !dep.multi && !dep.optional;
    const candidates = peekDependencyCandidates(dep, view, depOptions);
    if (required && candidates.length === 0) {
      const miss = missForValidate(view, dep.token, depOptions, [...pathNames, tokenName(dep.token)]);
      if (miss !== undefined) {
        throw miss;
      }
    }
    for (const candidate of candidates) {
      const end = followAliasChainToTerminal(candidate, view, depOptions);
      if (end.found) {
        edges.push({ terminal: end.terminal, owner: end.owner, depTokenName: tokenName(end.terminal.token) });
        continue;
      }
      if (required) {
        const miss = missForValidate(view, end.missingToken, depOptions, [
          ...pathNames,
          ...end.hopNames,
          tokenName(end.missingToken),
        ]);
        if (miss !== undefined) {
          throw miss;
        }
      }
    }
  }

  return edges;
}
