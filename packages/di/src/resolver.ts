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
import { runActivation, runActivationAsync } from "#/lifecycle";
import type { RegistryKey } from "#/registry";
import type { Token } from "#/token";
import { ScopeManager } from "#/scope";
import {
  AsyncResolutionError,
  CircularDependencyError,
  DiError,
  MissingMetadataError,
  NoMatchingBindingError,
  ScopeViolationError,
  TokenNotBoundError,
} from "#/errors";
import type { MetadataReader } from "#/decorators/metadata";

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

export class DependencyResolver {
  constructor(
    private readonly hooks: {
      readonly lookup: (key: RegistryKey) => readonly Binding<unknown>[] | undefined;
      readonly scopeManager: ScopeManager;
      readonly metadataReader?: MetadataReader;
    },
  ) {}

  resolveRoot<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T {
    return this.resolve(key, hint, [], new Set(), []) as T;
  }

  resolveAsyncRoot<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): Promise<T> {
    return this.resolveAsync(key, hint, [], new Set(), []) as Promise<T>;
  }

  resolveOptionalRoot<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T | undefined {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    const pathLabels: string[] = [label];
    const bindings = this.hooks.lookup(registryKey);
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
    if (candidates.length !== 1) {
      throw new DiError(
        `Ambiguous binding for "${label}": ${String(candidates.length)} candidates matched (resolution path: ${pathLabels.join(" -> ")})`,
      );
    }
    const binding = candidates[0];
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
      return this.instantiateBinding(binding, registryKey, hint, pathLabels, visiting, []) as T;
    } finally {
      visiting.delete(registryKey);
    }
  }

  resolveAllRoot<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): T[] {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    const basePath: string[] = [label];
    const bindings = this.hooks.lookup(registryKey);
    if (bindings === undefined || bindings.length === 0) {
      return [];
    }
    const selectionConstraintCtx = this.buildConstraintContext(basePath, [], hint);
    const candidates = filterMatchingBindings(bindings, hint, selectionConstraintCtx);
    if (candidates.length === 0) {
      if (hint !== undefined && (hint.name !== undefined || hint.tag !== undefined)) {
        throw new NoMatchingBindingError(label, hint, basePath);
      }
      return [];
    }
    const results: T[] = [];
    for (const binding of candidates) {
      this.assertDependencyScopeAllowed(binding, basePath, []);
      if (binding.kind === "async-dynamic") {
        throw new AsyncResolutionError(
          label,
          basePath,
          "encountered async-dynamic factory during synchronous resolveAll",
        );
      }
      const visiting = new Set<RegistryKey>();
      visiting.add(registryKey);
      try {
        results.push(
          this.instantiateBinding(binding, registryKey, hint, basePath, visiting, []) as T,
        );
      } finally {
        visiting.delete(registryKey);
      }
    }
    return results;
  }

  async resolveAllAsyncRoot<T>(key: Token<T> | Constructor<T>, hint?: ResolveHint): Promise<T[]> {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    const basePath: string[] = [label];
    const bindings = this.hooks.lookup(registryKey);
    if (bindings === undefined || bindings.length === 0) {
      return [];
    }
    const selectionConstraintCtx = this.buildConstraintContext(basePath, [], hint);
    const candidates = filterMatchingBindings(bindings, hint, selectionConstraintCtx);
    if (candidates.length === 0) {
      if (hint !== undefined && (hint.name !== undefined || hint.tag !== undefined)) {
        throw new NoMatchingBindingError(label, hint, basePath);
      }
      return [];
    }
    const results: T[] = [];
    for (const binding of candidates) {
      this.assertDependencyScopeAllowed(binding, basePath, []);
      const visiting = new Set<RegistryKey>();
      visiting.add(registryKey);
      try {
        results.push(
          (await this.instantiateBindingAsync(
            binding,
            registryKey,
            hint,
            basePath,
            visiting,
            [],
          )) as T,
        );
      } finally {
        visiting.delete(registryKey);
      }
    }
    return results;
  }

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

  private createContext(
    pathLabels: readonly string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
    currentResolveHint: ResolveHint | undefined,
  ): ResolutionContext {
    const constraint = this.buildConstraintContext(
      pathLabels,
      materializationStack,
      currentResolveHint,
    );
    return {
      resolve: <T>(k: Token<T> | Constructor<T>, h?: ResolveHint) =>
        this.resolve(k, h, [...pathLabels], visiting, materializationStack) as T,
      resolveAsync: <T>(k: Token<T> | Constructor<T>, h?: ResolveHint) =>
        this.resolveAsync(k, h, [...pathLabels], visiting, materializationStack) as Promise<T>,
      resolveOptional: <T>(k: Token<T> | Constructor<T>, h?: ResolveHint) => {
        try {
          return this.resolve(k, h, [...pathLabels], visiting, materializationStack) as T;
        } catch (caughtError: unknown) {
          if (caughtError instanceof TokenNotBoundError) {
            return undefined;
          }
          throw caughtError;
        }
      },
      constraint,
    };
  }

  /**
   * @param materializationStack Bindings along the current construction chain; used to block singleton→scoped/transient.
   */
  private resolve<T>(
    key: Token<T> | Constructor<T>,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): T {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    const nextPath = [...pathLabels, label];

    if (visiting.has(registryKey)) {
      throw new CircularDependencyError(nextPath);
    }

    const bindings = this.hooks.lookup(registryKey);
    if (bindings === undefined || bindings.length === 0) {
      throw new TokenNotBoundError(label, nextPath);
    }

    const selectionConstraintCtx = this.buildConstraintContext(
      nextPath,
      materializationStack,
      hint,
    );
    const binding = selectBindingForRegistry(
      bindings,
      hint,
      label,
      nextPath,
      selectionConstraintCtx,
    );
    this.assertDependencyScopeAllowed(binding, nextPath, materializationStack);

    if (binding.kind === "async-dynamic") {
      throw new AsyncResolutionError(
        label,
        nextPath,
        "encountered async-dynamic factory during synchronous resolution",
      );
    }

    visiting.add(registryKey);
    try {
      return this.instantiateBinding(
        binding,
        registryKey,
        hint,
        nextPath,
        visiting,
        materializationStack,
      ) as T;
    } finally {
      visiting.delete(registryKey);
    }
  }

  /**
   * @param materializationStack Same captive-dependency chain as {@link resolve}.
   */
  private async resolveAsync<T>(
    key: Token<T> | Constructor<T>,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Promise<T> {
    const registryKey = key as RegistryKey;
    const label = registryKeyLabel(key);
    const nextPath = [...pathLabels, label];

    if (visiting.has(registryKey)) {
      throw new CircularDependencyError(nextPath);
    }

    const bindings = this.hooks.lookup(registryKey);
    if (bindings === undefined || bindings.length === 0) {
      throw new TokenNotBoundError(label, nextPath);
    }

    const selectionConstraintCtx = this.buildConstraintContext(
      nextPath,
      materializationStack,
      hint,
    );
    const binding = selectBindingForRegistry(
      bindings,
      hint,
      label,
      nextPath,
      selectionConstraintCtx,
    );
    this.assertDependencyScopeAllowed(binding, nextPath, materializationStack);

    visiting.add(registryKey);
    try {
      return (await this.instantiateBindingAsync(
        binding,
        registryKey,
        hint,
        nextPath,
        visiting,
        materializationStack,
      )) as T;
    } finally {
      visiting.delete(registryKey);
    }
  }

  private instantiateBinding(
    binding: Binding<unknown>,
    registryKey: RegistryKey,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): unknown {
    this.assertCaptiveDependencyFromMaterializationStack(binding, pathLabels, materializationStack);
    return this.hooks.scopeManager.getOrCreate(binding, () => {
      const frame = bindingToMaterializationFrame(registryKey, binding);
      // Push parent frame so nested ctx.resolve sees the consumer scope (captive dependency check).
      const extendedStack = [...materializationStack, frame];
      const ctx = this.createContext(pathLabels, visiting, extendedStack, hint);
      const instance = this.materialize(binding, hint, ctx, pathLabels, visiting, extendedStack);
      return runActivation(binding, instance, ctx, pathLabels);
    });
  }

  private async instantiateBindingAsync(
    binding: Binding<unknown>,
    registryKey: RegistryKey,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Promise<unknown> {
    this.assertCaptiveDependencyFromMaterializationStack(binding, pathLabels, materializationStack);
    return this.hooks.scopeManager.getOrCreateAsync(binding, async () => {
      const frame = bindingToMaterializationFrame(registryKey, binding);
      // Push parent frame so nested ctx.resolve sees the consumer scope (captive dependency check).
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
      return await runActivationAsync(binding, instance, ctx, pathLabels);
    });
  }

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
        const result = binding.factory(ctx);
        if (
          typeof result === "object" &&
          result !== null &&
          "then" in result &&
          typeof (result as Promise<unknown>).then === "function"
        ) {
          throw new AsyncResolutionError(
            pathLabels[pathLabels.length - 1] ?? "(unknown)",
            pathLabels,
            "dynamic factory returned a Promise during synchronous resolution",
          );
        }
        return result;
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
        const product = binding.factory(...deps);
        if (
          typeof product === "object" &&
          product !== null &&
          "then" in product &&
          typeof (product as Promise<unknown>).then === "function"
        ) {
          throw new AsyncResolutionError(
            pathLabels[pathLabels.length - 1] ?? "(unknown)",
            pathLabels,
            "resolved factory returned a Promise during synchronous resolution",
          );
        }
        return product;
      }
      case "alias":
        return this.resolve(binding.targetToken, hint, pathLabels, visiting, materializationStack);
      default: {
        const exhaustive: never = binding;
        return exhaustive;
      }
    }
  }

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

  private instantiateClassBinding(
    binding: Extract<Binding<unknown>, { kind: "class" }>,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): unknown {
    const reader = this.hooks.metadataReader;
    const Ctor = binding.ctor as new (...args: unknown[]) => unknown;
    const ctorKey = binding.ctor;

    if (reader === undefined) {
      return new Ctor();
    }

    const meta = reader.getConstructorMetadata(ctorKey);
    const arity = (Ctor as Function).length;
    if (arity > 0 && meta === undefined) {
      throw new MissingMetadataError(registryKeyLabel(ctorKey), pathLabels);
    }
    if (meta === undefined || meta.params.length === 0) {
      return new Ctor();
    }

    const deps = meta.params.map((param) => {
      const paramHint =
        param.name !== undefined
          ? { name: param.name }
          : param.tag !== undefined
            ? { tag: param.tag }
            : undefined;
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
    return new Ctor(...deps);
  }

  private async instantiateClassBindingAsync(
    binding: Extract<Binding<unknown>, { kind: "class" }>,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): Promise<unknown> {
    const reader = this.hooks.metadataReader;
    const Ctor = binding.ctor as new (...args: unknown[]) => unknown;
    const ctorKey = binding.ctor;

    if (reader === undefined) {
      return new Ctor();
    }

    const meta = reader.getConstructorMetadata(ctorKey);
    const arity = (Ctor as Function).length;
    if (arity > 0 && meta === undefined) {
      throw new MissingMetadataError(registryKeyLabel(ctorKey), pathLabels);
    }
    if (meta === undefined || meta.params.length === 0) {
      return new Ctor();
    }

    const deps: unknown[] = [];
    for (const param of meta.params) {
      const paramHint =
        param.name !== undefined
          ? { name: param.name }
          : param.tag !== undefined
            ? { tag: param.tag }
            : undefined;
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
    return new Ctor(...deps);
  }
}
