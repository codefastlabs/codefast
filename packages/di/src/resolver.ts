import type {
  Binding,
  ConstraintBindingKind,
  Constructor,
  ConstraintContext,
  MaterializationFrame,
  ResolutionContext,
  ResolveHint,
} from "#lib/binding";
import { registryKeyLabel, selectBindingForRegistry } from "#lib/binding-select";
import type { RegistryKey } from "#lib/registry";
import type { Token } from "#lib/token";
import { ScopeManager } from "#lib/scope";
import {
  AsyncResolutionError,
  CircularDependencyError,
  MissingMetadataError,
  ScopeViolationError,
  TokenNotBoundError,
} from "#lib/errors";
import type { MetadataReader } from "#lib/decorators/metadata";

function isPromiseLike(value: unknown): value is Promise<unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    "then" in value &&
    typeof (value as Promise<unknown>).then === "function"
  );
}

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
      throw new ScopeViolationError({
        consumerBindingId: consumer.bindingId,
        consumerKind: consumer.bindingKind,
        consumerScope: consumer.scope,
        dependencyBindingId: dependencyBinding.id,
        dependencyKind: dependencyBinding.kind,
        dependencyScope: dependencyBinding.scope,
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
      constraint,
    };
  }

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
      return this.instantiateBindingSync(
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

  private instantiateBindingSync(
    binding: Binding<unknown>,
    registryKey: RegistryKey,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: readonly MaterializationFrame[],
  ): unknown {
    return this.hooks.scopeManager.getOrCreate(binding, () => {
      const frame = bindingToMaterializationFrame(registryKey, binding);
      const extendedStack = [...materializationStack, frame];
      const ctx = this.createContext(pathLabels, visiting, extendedStack, hint);
      const instance = this.materializeSync(
        binding,
        hint,
        ctx,
        pathLabels,
        visiting,
        extendedStack,
      );
      this.runActivationSync(binding, instance, ctx, pathLabels);
      return instance;
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
    return this.hooks.scopeManager.getOrCreateAsync(binding, async () => {
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
      await this.runActivationAsync(binding, instance, ctx, pathLabels);
      return instance;
    });
  }

  private materializeSync(
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
        return this.instantiateClassBindingSync(
          binding,
          pathLabels,
          visiting,
          materializationStack,
        );
      case "dynamic": {
        const result = binding.factory(ctx);
        if (isPromiseLike(result)) {
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
        if (isPromiseLike(product)) {
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

  private instantiateClassBindingSync(
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
    if (meta === undefined || meta.parameters.length === 0) {
      return new Ctor();
    }

    const deps = meta.parameters.map((param) => {
      const paramHint = param.hint;
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
    if (meta === undefined || meta.parameters.length === 0) {
      return new Ctor();
    }

    const deps: unknown[] = [];
    for (const param of meta.parameters) {
      const paramHint = param.hint;
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

  private runActivationSync(
    binding: Binding<unknown>,
    instance: unknown,
    ctx: ResolutionContext,
    pathLabels: string[],
  ): void {
    const handler = binding.onActivation;
    if (handler === undefined) {
      return;
    }
    const tokenLabel = pathLabels[pathLabels.length - 1] ?? "(unknown)";
    const result = handler(ctx, instance);
    if (isPromiseLike(result)) {
      throw new AsyncResolutionError(
        tokenLabel,
        pathLabels,
        "onActivation returned a Promise during synchronous resolution",
      );
    }
  }

  private async runActivationAsync(
    binding: Binding<unknown>,
    instance: unknown,
    ctx: ResolutionContext,
    _pathLabels: string[],
  ): Promise<void> {
    const handler = binding.onActivation;
    if (handler === undefined) {
      return;
    }
    await handler(ctx, instance);
  }
}
