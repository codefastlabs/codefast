import type {
  Binding,
  ConstraintBindingKind,
  Constructor,
  ConstraintContext,
  MaterializationFrame,
  ResolutionContext,
  ResolveHint,
} from "#/binding";
import {
  filterMatchingBindings,
  registryKeyLabel,
  selectBindingForRegistry,
} from "#/binding-select";
import {
  isPromiseLike,
  runActivation,
  runActivationAsync,
  runPostConstruct,
  runPostConstructAsync,
} from "#/lifecycle";
import type { RegistryKey } from "#/registry";
import type { Token } from "#/token";
import { ScopeManager } from "#/scope";
import {
  AsyncResolutionError,
  CircularDependencyError,
  MissingMetadataError,
  NoMatchingBindingError,
  ScopeViolationError,
  TokenNotBoundError,
} from "#/errors";
import type { MetadataReader } from "#/metadata/metadata-types";

/**
 * Converts a registry key + binding into a {@link MaterializationFrame} for the captive-dependency stack.
 */
function bindingToMaterializationFrame(
  registryKey: RegistryKey,
  binding: Binding<unknown>,
): MaterializationFrame {
  return {
    registryKey,
    bindingId: binding.id,
    bindingKind: binding.kind as ConstraintBindingKind,
    tags: binding.tags,
    scope: binding.scope,
  };
}

/**
 * Dependencies injected into {@link DependencyResolver} at construction time.
 */
export type ResolverDependencies = {
  /**
   * Looks up all bindings registered for a given registry key (own + parent containers).
   */
  readonly lookup: (key: RegistryKey) => readonly Binding<unknown>[] | undefined;
  /**
   * Manages singleton/scoped instance caches and deactivation.
   */
  readonly scopeManager: ScopeManager;
  /**
   * Reads `@injectable()` and lifecycle metadata from constructors. Omit to disable decorator support.
   */
  readonly metadataReader?: MetadataReader;
};

/**
 * Stateless graph walker: selects a binding, checks for cycles and scope violations,
 * delegates instance caching to `ScopeManager`, and runs lifecycle hooks.
 *
 * Resolution algorithm (per token):
 * 1. Lookup all bindings for the registry key.
 * 2. Apply name/tag hint and `when()` constraint filtering.
 * 3. Circular-dependency check via a mutable `visiting` set (per call tree).
 * 4. Captive-dependency check via the `materializationStack`.
 * 5. Scope-cache hit → return cached instance.
 * 6. Scope-cache miss → `materialize` → `@postConstruct` → `onActivation` → cache.
 *
 * Used exclusively by `DefaultContainer`; not part of the public API.
 */
export class DependencyResolver {
  constructor(private readonly deps: ResolverDependencies) {}

  /**
   * Entry point for synchronous single-binding resolution.
   *
   * @throws {@link TokenNotBoundError} — no binding registered for `key`, or a nested dependency is unbound.
   * @throws {@link NoMatchingBindingError} — a name/tag `hint` was given for `key` but no binding matched it.
   * @throws {@link InternalError} — multiple bindings matched for `key` after applying the hint (ambiguous).
   * @throws {@link CircularDependencyError} — `key` or a nested token appears twice on the resolution stack.
   * @throws {@link AsyncResolutionError} — an `async-dynamic` binding or async lifecycle/activation on the sync path.
   * @throws {@link ScopeViolationError} — captive dependency (singleton → scoped/transient).
   * @throws {@link MissingMetadataError} — `class` binding lacks injectable metadata when the reader requires it.
   */
  resolveRoot<Value>(key: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value {
    return this.resolve(key, hint, [], new Set(), []) as Value;
  }

  /**
   * Entry point for async single-binding resolution. Awaits `async-dynamic` factories
   * and async lifecycle hooks that would cause {@link AsyncResolutionError} on the sync path.
   *
   * @throws {@link TokenNotBoundError} — no binding registered for `key`, or a nested dependency is unbound.
   * @throws {@link NoMatchingBindingError} — a name/tag `hint` was given for `key` but no binding matched it.
   * @throws {@link InternalError} — multiple bindings matched for `key` after applying the hint (ambiguous).
   * @throws {@link CircularDependencyError} — `key` or a nested token appears twice on the resolution stack.
   * @throws {@link ScopeViolationError} — captive dependency (singleton → scoped/transient).
   * @throws {@link MissingMetadataError} — `class` binding lacks injectable metadata when the reader requires it.
   */
  resolveAsyncRoot<Value>(
    key: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value> {
    return this.resolveAsync(key, hint, [], new Set(), []) as Promise<Value>;
  }

  /**
   * Optional resolution for the **requested key only**: returns `undefined` when that key has no
   * bindings or every candidate is filtered out **without** a name/tag hint — without throwing
   * {@link TokenNotBoundError} for those cases. Instantiating the selected binding still runs the
   * normal sync resolution path for nested dependencies; an unregistered transitive dependency
   * throws {@link TokenNotBoundError} as usual.
   *
   * Behavioral rules:
   * 1. If the registry key is completely unbound → returns `undefined`.
   * 2. If no candidate survives constraint filtering (without a hint) → returns `undefined`.
   * 3. If a name/tag hint was provided but no binding matches it → throws {@link NoMatchingBindingError}.
   * 4. Still throws on: circular dependencies, async operations on the sync path,
   *    scope violations, ambiguous multi-binding matches, and {@link TokenNotBoundError} when a
   *    required nested dependency is unbound.
   */
  resolveOptionalRoot<Value>(
    key: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Value | undefined {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    const pathLabels: string[] = [label];
    const bindings = this.deps.lookup(registryKey);
    if (bindings === undefined || bindings.length === 0) {
      return undefined;
    }
    const selectionConstraintCtx = this.buildConstraintContext(pathLabels, [], hint);
    const candidates = filterMatchingBindings(bindings, hint, selectionConstraintCtx);
    if (candidates.length === 0) {
      if (hint !== undefined && (hint.name !== undefined || hint.tag !== undefined)) {
        throw new NoMatchingBindingError(label, hint, pathLabels);
      }
      return undefined;
    }
    const binding = selectBindingForRegistry(
      bindings,
      hint,
      label,
      pathLabels,
      selectionConstraintCtx,
    );
    this.assertDependencyScopeAllowed(binding, pathLabels, []);
    if (binding.kind === "async-dynamic") {
      throw new AsyncResolutionError(
        label,
        pathLabels,
        "encountered async-dynamic factory during synchronous resolution",
      );
    }
    const visiting = new Set<RegistryKey>();
    visiting.add(registryKey);
    try {
      return this.instantiateBinding(binding, registryKey, hint, pathLabels, visiting, []) as Value;
    } finally {
      visiting.delete(registryKey);
    }
  }

  /**
   * Resolves every matching binding for `key` synchronously into an array.
   * Returns an empty array when no bindings exist (does not throw).
   *
   * @throws {@link AsyncResolutionError} — any candidate is `async-dynamic`.
   * @throws {@link NoMatchingBindingError} — hint was specified but no binding matched it.
   * @throws {@link TokenNotBoundError} — nested dependency unbound (same as {@link resolveRoot}).
   * @throws {@link CircularDependencyError} — cycle while materializing a candidate.
   * @throws {@link ScopeViolationError} — captive dependency during materialization.
   * @throws {@link MissingMetadataError} — class binding lacks injectable metadata when required.
   */
  resolveAllRoot<Value>(key: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value[] {
    return this.resolveAll(key, hint, [], new Set(), []);
  }

  /**
   * Async counterpart of {@link resolveAllRoot}: resolves every matching binding for `key`,
   * awaiting `async-dynamic` factories. Returns an empty array when no bindings exist.
   *
   * @throws {@link NoMatchingBindingError} — hint was specified but no binding matched it.
   * @throws {@link TokenNotBoundError} — nested dependency unbound (same as {@link resolveAsyncRoot}).
   * @throws {@link CircularDependencyError} — cycle while materializing a candidate.
   * @throws {@link ScopeViolationError} — captive dependency during materialization.
   * @throws {@link MissingMetadataError} — class binding lacks injectable metadata when required.
   */
  async resolveAllAsyncRoot<Value>(
    key: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value[]> {
    return this.resolveAllAsync(key, hint, [], new Set(), []);
  }

  /**
   * Context-aware sync `resolveAll`: extends the current resolution path and preserves
   * visiting/materialization stacks so nested multi-resolution participates in cycle and
   * captive-dependency checks exactly like single-value {@link resolve}.
   */
  private resolveAll<Value>(
    key: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Value[] {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    pathLabels.push(label);
    try {
      if (visiting.has(registryKey)) {
        throw new CircularDependencyError([...pathLabels]);
      }

      const bindings = this.deps.lookup(registryKey);
      if (bindings === undefined || bindings.length === 0) {
        return [];
      }
      const selectionConstraintCtx = this.buildConstraintContext(
        pathLabels,
        materializationStack,
        hint,
      );
      const candidates = filterMatchingBindings(bindings, hint, selectionConstraintCtx);
      if (candidates.length === 0) {
        if (hint !== undefined && (hint.name !== undefined || hint.tag !== undefined)) {
          throw new NoMatchingBindingError(label, hint, [...pathLabels]);
        }
        return [];
      }

      visiting.add(registryKey);
      const results: Value[] = [];
      try {
        for (const binding of candidates) {
          this.assertDependencyScopeAllowed(binding, pathLabels, materializationStack);
          if (binding.kind === "async-dynamic") {
            throw new AsyncResolutionError(
              label,
              [...pathLabels],
              "encountered async-dynamic factory during synchronous resolveAll",
            );
          }
          results.push(
            this.instantiateBinding(
              binding,
              registryKey,
              hint,
              pathLabels,
              visiting,
              materializationStack,
            ) as Value,
          );
        }
      } finally {
        visiting.delete(registryKey);
      }
      return results;
    } finally {
      pathLabels.pop();
    }
  }

  /**
   * Async counterpart of {@link resolveAll}: keeps the current path and materialization stack
   * so `when()` constraints and scope validation behave consistently for nested multi-resolution.
   */
  private async resolveAllAsync<Value>(
    key: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Promise<Value[]> {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    pathLabels.push(label);
    try {
      if (visiting.has(registryKey)) {
        throw new CircularDependencyError([...pathLabels]);
      }

      const bindings = this.deps.lookup(registryKey);
      if (bindings === undefined || bindings.length === 0) {
        return [];
      }
      const selectionConstraintCtx = this.buildConstraintContext(
        pathLabels,
        materializationStack,
        hint,
      );
      const candidates = filterMatchingBindings(bindings, hint, selectionConstraintCtx);
      if (candidates.length === 0) {
        if (hint !== undefined && (hint.name !== undefined || hint.tag !== undefined)) {
          throw new NoMatchingBindingError(label, hint, [...pathLabels]);
        }
        return [];
      }

      visiting.add(registryKey);
      const results: Value[] = [];
      try {
        for (const binding of candidates) {
          this.assertDependencyScopeAllowed(binding, pathLabels, materializationStack);
          results.push(
            (await this.instantiateBindingAsync(
              binding,
              registryKey,
              hint,
              pathLabels,
              visiting,
              materializationStack,
            )) as Value,
          );
        }
      } finally {
        visiting.delete(registryKey);
      }
      return results;
    } finally {
      pathLabels.pop();
    }
  }

  /**
   * Assembles the read-only {@link ConstraintContext} snapshot passed to `when()` predicates.
   * Extracts the top-of-stack frame as `parent` and the rest as `ancestors`.
   */
  private buildConstraintContext(
    resolutionPath: readonly string[],
    materializationStack: readonly MaterializationFrame[],
    currentResolveHint: ResolveHint | undefined,
  ): ConstraintContext {
    const parent =
      materializationStack.length > 0
        ? materializationStack[materializationStack.length - 1]
        : undefined;
    const ancestors = materializationStack.slice(0, -1);
    return {
      resolutionPath,
      materializationStack,
      parent,
      ancestors,
      currentResolveHint,
    };
  }

  /**
   * Throws {@link ScopeViolationError} when the immediate consumer on the stack is a singleton
   * and the dependency has `"scoped"` or `"transient"` lifetime (captive dependency).
   * Constants are exempt — they have no scope cache.
   */
  private assertDependencyScopeAllowed(
    dependencyBinding: Binding<unknown>,
    resolutionPath: readonly string[],
    materializationStack: readonly MaterializationFrame[],
  ): void {
    const consumer = materializationStack[materializationStack.length - 1];
    if (consumer === undefined) {
      return;
    }
    if (consumer.scope !== "singleton") {
      return;
    }
    if (dependencyBinding.kind === "constant") {
      return;
    }
    if (dependencyBinding.scope === "transient" || dependencyBinding.scope === "scoped") {
      const dependencyLabel = resolutionPath[resolutionPath.length - 1];
      const consumerLabel =
        resolutionPath.length >= 2 ? resolutionPath[resolutionPath.length - 2] : undefined;
      throw new ScopeViolationError({
        consumerBindingId: consumer.bindingId,
        consumerKind: consumer.bindingKind,
        consumerScope: consumer.scope,
        consumerLabel,
        dependencyBindingId: dependencyBinding.id,
        dependencyKind: dependencyBinding.kind,
        dependencyScope: dependencyBinding.scope,
        dependencyLabel,
        resolutionPath: [...resolutionPath],
      });
    }
  }

  /**
   * Builds a {@link ResolutionContext} for use inside factories and lifecycle hooks.
   * The `resolve` / `resolveAsync` / `resolveOptional` closures carry the current path and
   * materialization stack forward so nested calls inherit captive-dependency checks.
   */
  private createContext(
    /**
     * Mutable label path accumulated so far; closures snapshot it with spread before extending.
     */
    pathLabels: readonly string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
    currentResolveHint: ResolveHint | undefined,
  ): ResolutionContext {
    const graphContext = this.buildConstraintContext(
      pathLabels,
      materializationStack,
      currentResolveHint,
    );
    return {
      resolve: <Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint) =>
        this.resolve(token, hint, [...pathLabels], visiting, materializationStack) as Value,
      resolveAsync: <Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint) =>
        this.resolveAsync(
          token,
          hint,
          [...pathLabels],
          visiting,
          materializationStack,
        ) as Promise<Value>,
      resolveOptional: <Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint) => {
        try {
          return this.resolve(
            token,
            hint,
            [...pathLabels],
            visiting,
            materializationStack,
          ) as Value;
        } catch (caughtError: unknown) {
          if (caughtError instanceof TokenNotBoundError) {
            return undefined;
          }
          throw caughtError;
        }
      },
      resolveAll: <Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint) =>
        this.resolveAll(token, hint, [...pathLabels], visiting, materializationStack) as Value[],
      resolveAllAsync: <Value>(token: Token<Value> | Constructor<Value>, hint?: ResolveHint) =>
        this.resolveAllAsync(
          token,
          hint,
          [...pathLabels],
          visiting,
          materializationStack,
        ) as Promise<Value[]>,
      graph: graphContext,
    };
  }

  /**
   * Core synchronous resolution: lookup → filter → cycle check → scope check → instantiate.
   * Called recursively when a binding's dependencies need resolution.
   *
   * @param key - Token or constructor being resolved.
   * @param hint - Optional name/tag filter for multi-binding selection.
   * @param pathLabels - Mutable label path accumulated during graph walk; extended in place.
   * @param visiting - Registry keys currently on the call stack; used for circular-dependency detection.
   * @param materializationStack - Bindings along the current construction chain; used to block singleton→scoped/transient.
   */
  private resolve<Value>(
    key: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Value {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    pathLabels.push(label);
    try {
      if (visiting.has(registryKey)) {
        throw new CircularDependencyError([...pathLabels]);
      }

      const bindings = this.deps.lookup(registryKey);
      if (bindings === undefined || bindings.length === 0) {
        throw new TokenNotBoundError(label, [...pathLabels]);
      }

      const hasConstraint = bindings.some((binding) => binding.constraint !== undefined);
      const selectionConstraintCtx = hasConstraint
        ? this.buildConstraintContext(pathLabels, materializationStack, hint)
        : undefined;
      const binding = selectBindingForRegistry(
        bindings,
        hint,
        label,
        pathLabels,
        selectionConstraintCtx,
      );
      this.assertDependencyScopeAllowed(binding, pathLabels, materializationStack);

      if (binding.kind === "async-dynamic") {
        throw new AsyncResolutionError(
          label,
          [...pathLabels],
          "encountered async-dynamic factory during synchronous resolution",
        );
      }

      visiting.add(registryKey);
      try {
        return this.instantiateBinding(
          binding,
          registryKey,
          hint,
          pathLabels,
          visiting,
          materializationStack,
        ) as Value;
      } finally {
        visiting.delete(registryKey);
      }
    } finally {
      pathLabels.pop();
    }
  }

  /**
   * Core async resolution: same pipeline as {@link resolve} but awaits `async-dynamic`
   * factories and async lifecycle hooks instead of throwing {@link AsyncResolutionError}.
   *
   * @param key - Token or constructor being resolved.
   * @param hint - Optional name/tag filter for multi-binding selection.
   * @param pathLabels - Mutable label path accumulated during graph walk; extended in place.
   * @param visiting - Registry keys currently on the call stack; used for circular-dependency detection.
   * @param materializationStack - Same captive-dependency chain as {@link resolve}.
   */
  private async resolveAsync<Value>(
    key: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Promise<Value> {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    pathLabels.push(label);
    try {
      if (visiting.has(registryKey)) {
        throw new CircularDependencyError([...pathLabels]);
      }

      const bindings = this.deps.lookup(registryKey);
      if (bindings === undefined || bindings.length === 0) {
        throw new TokenNotBoundError(label, [...pathLabels]);
      }

      const selectionConstraintCtx = this.buildConstraintContext(
        pathLabels,
        materializationStack,
        hint,
      );
      const binding = selectBindingForRegistry(
        bindings,
        hint,
        label,
        pathLabels,
        selectionConstraintCtx,
      );
      this.assertDependencyScopeAllowed(binding, pathLabels, materializationStack);

      visiting.add(registryKey);
      try {
        return (await this.instantiateBindingAsync(
          binding,
          registryKey,
          hint,
          pathLabels,
          visiting,
          materializationStack,
        )) as Value;
      } finally {
        visiting.delete(registryKey);
      }
    } finally {
      pathLabels.pop();
    }
  }

  /**
   * Handles scope-cache lookup / storage and lifecycle hooks (`@postConstruct`, `onActivation`)
   * around a synchronous call to {@link materialize}.
   */
  private instantiateBinding(
    binding: Binding<unknown>,
    registryKey: RegistryKey,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): unknown {
    this.assertCaptiveDependencyFromMaterializationStack(binding, pathLabels, materializationStack);
    const cached = this.deps.scopeManager.getCached(binding);
    if (cached !== undefined) {
      return cached;
    }
    return this.deps.scopeManager.getOrCreate(binding, () => {
      const frame = bindingToMaterializationFrame(registryKey, binding);
      const extendedStack = [...materializationStack, frame];
      const ctx = this.createContext(pathLabels, visiting, extendedStack, hint);
      const instance = this.materialize(binding, hint, ctx, pathLabels, visiting, extendedStack);
      if (binding.kind === "class") {
        runPostConstruct(binding.implementationClass, instance, pathLabels);
      }
      return runActivation(binding, instance, ctx, pathLabels);
    });
  }

  /**
   * Async counterpart of {@link instantiateBinding}: delegates to {@link materializeAsync}
   * and awaits `@postConstruct` and `onActivation` hooks.
   */
  private async instantiateBindingAsync(
    binding: Binding<unknown>,
    registryKey: RegistryKey,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Promise<unknown> {
    this.assertCaptiveDependencyFromMaterializationStack(binding, pathLabels, materializationStack);
    if (binding.scope === "transient") {
      const frame = bindingToMaterializationFrame(registryKey, binding);
      const extendedStack = [...materializationStack, frame];
      const ctx = this.createContext(pathLabels, visiting, extendedStack, hint);
      const instance = await this.materializeAsync(
        binding,
        hint,
        ctx,
        pathLabels,
        visiting,
        extendedStack,
      );
      if (binding.kind === "class") {
        await runPostConstructAsync(binding.implementationClass, instance);
      }
      return await runActivationAsync(binding, instance, ctx, pathLabels);
    }
    return this.deps.scopeManager.getOrCreateAsync(binding, async () => {
      const frame = bindingToMaterializationFrame(registryKey, binding);
      const extendedStack = [...materializationStack, frame];
      const ctx = this.createContext(pathLabels, visiting, extendedStack, hint);
      const instance = await this.materializeAsync(
        binding,
        hint,
        ctx,
        pathLabels,
        visiting,
        extendedStack,
      );
      if (binding.kind === "class") {
        await runPostConstructAsync(binding.implementationClass, instance);
      }
      return await runActivationAsync(binding, instance, ctx, pathLabels);
    });
  }

  /**
   * Duplicate captive-dependency guard applied at instantiation time (after scope-cache miss),
   * checking the top of the materialization stack rather than the raw `ConstraintContext`.
   */
  private assertCaptiveDependencyFromMaterializationStack(
    dependencyBinding: Binding<unknown>,
    resolutionPath: readonly string[],
    materializationStack: readonly MaterializationFrame[],
  ): void {
    const parentFrame = materializationStack[materializationStack.length - 1];
    if (parentFrame === undefined) {
      return;
    }
    if (parentFrame.scope !== "singleton") {
      return;
    }
    if (dependencyBinding.kind === "constant") {
      return;
    }
    if (dependencyBinding.scope === "scoped" || dependencyBinding.scope === "transient") {
      const dependencyLabel = resolutionPath[resolutionPath.length - 1];
      const consumerLabel =
        resolutionPath.length >= 2 ? resolutionPath[resolutionPath.length - 2] : undefined;
      throw new ScopeViolationError({
        consumerBindingId: parentFrame.bindingId,
        consumerKind: parentFrame.bindingKind,
        consumerScope: parentFrame.scope,
        consumerLabel,
        dependencyBindingId: dependencyBinding.id,
        dependencyKind: dependencyBinding.kind,
        dependencyScope: dependencyBinding.scope,
        dependencyLabel,
        resolutionPath: [...resolutionPath],
      });
    }
  }

  /**
   * Synchronously produces the raw instance for a binding **without** touching the scope cache
   * or running lifecycle hooks. The caller ({@link instantiateBinding}) wraps this with
   * cache logic and post-construction hooks.
   *
   * Dispatches on `binding.kind`; throws {@link AsyncResolutionError} if the binding is
   * `async-dynamic` or if a `dynamic` / `resolved` factory returns a Promise.
   */
  private materialize(
    binding: Binding<unknown>,
    hint: ResolveHint | undefined,
    ctx: ResolutionContext,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): unknown {
    switch (binding.kind) {
      case "constant":
        return binding.value;
      case "class":
        return this.instantiateClassBinding(binding, pathLabels, visiting, materializationStack);
      case "dynamic": {
        const factoryResult = binding.factory(ctx);
        if (isPromiseLike(factoryResult)) {
          throw new AsyncResolutionError(
            pathLabels[pathLabels.length - 1] ?? "(unknown)",
            pathLabels,
            "dynamic factory returned a Promise during synchronous resolution",
          );
        }
        return factoryResult;
      }
      case "async-dynamic":
        throw new AsyncResolutionError(
          pathLabels[pathLabels.length - 1] ?? "(unknown)",
          pathLabels,
          "async-dynamic factory cannot be materialized synchronously",
        );
      case "resolved": {
        const deps: unknown[] = [];
        for (const depToken of binding.dependencyTokens) {
          deps.push(this.resolve(depToken, undefined, pathLabels, visiting, materializationStack));
        }
        const resolvedValue = binding.factory(...deps);
        if (isPromiseLike(resolvedValue)) {
          throw new AsyncResolutionError(
            pathLabels[pathLabels.length - 1] ?? "(unknown)",
            pathLabels,
            "resolved factory returned a Promise during synchronous resolution",
          );
        }
        return resolvedValue;
      }
      case "alias":
        return this.resolve(binding.targetToken, hint, pathLabels, visiting, materializationStack);
      default: {
        const exhaustive: never = binding;
        return exhaustive;
      }
    }
  }

  /**
   * Async counterpart of {@link materialize}; awaits `async-dynamic` factories and
   * recursively resolves `resolved`-binding dependencies with {@link resolveAsync}.
   */
  private async materializeAsync(
    binding: Binding<unknown>,
    hint: ResolveHint | undefined,
    ctx: ResolutionContext,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Promise<unknown> {
    switch (binding.kind) {
      case "constant":
        return binding.value;
      case "class":
        return this.instantiateClassBindingAsync(
          binding,
          pathLabels,
          visiting,
          materializationStack,
        );
      case "dynamic":
        return binding.factory(ctx);
      case "async-dynamic":
        return await binding.factory(ctx);
      case "resolved": {
        const deps: unknown[] = [];
        for (const depToken of binding.dependencyTokens) {
          deps.push(
            await this.resolveAsync(
              depToken,
              undefined,
              pathLabels,
              visiting,
              materializationStack,
            ),
          );
        }
        return binding.factory(...deps);
      }
      case "alias":
        return this.resolveAsync(
          binding.targetToken,
          hint,
          pathLabels,
          visiting,
          materializationStack,
        );
      default: {
        const exhaustive: never = binding;
        return exhaustive;
      }
    }
  }

  /**
   * Reads `@injectable()` constructor metadata and synchronously resolves each parameter,
   * then calls `new ImplementationClass(...deps)`. Throws {@link MissingMetadataError} when
   * the class has constructor parameters but no metadata.
   */
  private instantiateClassBinding(
    binding: Extract<Binding<unknown>, { kind: "class" }>,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): unknown {
    const reader = this.deps.metadataReader;
    const ImplementationClass = binding.implementationClass as new (...args: unknown[]) => unknown;

    if (reader === undefined) {
      return new ImplementationClass();
    }

    const meta = reader.getConstructorMetadata(binding.implementationClass);
    const arity = (ImplementationClass as Function).length;
    if (arity > 0 && meta === undefined) {
      throw new MissingMetadataError(registryKeyLabel(binding.implementationClass), pathLabels);
    }
    if (meta === undefined || meta.params.length === 0) {
      return new ImplementationClass();
    }

    const deps = meta.params.map((param) => {
      const paramHint =
        param.name !== undefined
          ? { name: param.name }
          : param.tag !== undefined
            ? { tag: param.tag }
            : undefined;
      if (param.isInjectAllBindings === true) {
        return this.resolveAll(param.token, paramHint, pathLabels, visiting, materializationStack);
      }
      if (param.optional) {
        try {
          return this.resolve(param.token, paramHint, pathLabels, visiting, materializationStack);
        } catch (caughtError: unknown) {
          if (caughtError instanceof TokenNotBoundError) {
            return undefined;
          }
          throw caughtError;
        }
      }
      return this.resolve(param.token, paramHint, pathLabels, visiting, materializationStack);
    });
    return new ImplementationClass(...deps);
  }

  /**
   * Async counterpart of {@link instantiateClassBinding}: resolves constructor dependencies
   * with {@link resolveAsync} so `async-dynamic` parameters are awaited in order.
   */
  private async instantiateClassBindingAsync(
    binding: Extract<Binding<unknown>, { kind: "class" }>,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Promise<unknown> {
    const reader = this.deps.metadataReader;
    const ImplementationClass = binding.implementationClass as new (...args: unknown[]) => unknown;

    if (reader === undefined) {
      return new ImplementationClass();
    }

    const meta = reader.getConstructorMetadata(binding.implementationClass);
    const arity = (ImplementationClass as Function).length;
    if (arity > 0 && meta === undefined) {
      throw new MissingMetadataError(registryKeyLabel(binding.implementationClass), pathLabels);
    }
    if (meta === undefined || meta.params.length === 0) {
      return new ImplementationClass();
    }

    const deps: unknown[] = [];
    for (const param of meta.params) {
      const paramHint =
        param.name !== undefined
          ? { name: param.name }
          : param.tag !== undefined
            ? { tag: param.tag }
            : undefined;
      if (param.isInjectAllBindings === true) {
        deps.push(
          await this.resolveAllAsync(
            param.token,
            paramHint,
            pathLabels,
            visiting,
            materializationStack,
          ),
        );
        continue;
      }
      if (param.optional) {
        try {
          deps.push(
            await this.resolveAsync(
              param.token,
              paramHint,
              pathLabels,
              visiting,
              materializationStack,
            ),
          );
        } catch (caughtError: unknown) {
          if (caughtError instanceof TokenNotBoundError) {
            deps.push(undefined);
          } else {
            throw caughtError;
          }
        }
      } else {
        deps.push(
          await this.resolveAsync(
            param.token,
            paramHint,
            pathLabels,
            visiting,
            materializationStack,
          ),
        );
      }
    }
    return new ImplementationClass(...deps);
  }
}
