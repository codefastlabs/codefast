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
export type ResolverDependencies = {
  readonly lookup: (key: RegistryKey) => readonly Binding<unknown>[] | undefined;
  readonly scopeManager: ScopeManager;
  readonly metadataReader?: MetadataReader;
};
export class DependencyResolver {
  constructor(private readonly deps: ResolverDependencies) {}
  resolveRoot<Value>(key: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value {
    return this.resolve(key, hint, [], new Set(), []) as Value;
  }
  resolveAsyncRoot<Value>(
    key: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value> {
    return this.resolveAsync(key, hint, [], new Set(), []) as Promise<Value>;
  }
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
    const hasConstraint = bindings.some((binding) => binding.constraint !== undefined);
    const selectionConstraintCtx = hasConstraint
      ? this.buildConstraintContext(pathLabels, [], hint)
      : undefined;
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
    const materializationStack: MaterializationFrame[] = [];
    this.assertDependencyScopeAllowed(binding, pathLabels, materializationStack);
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
  }
  resolveAllRoot<Value>(key: Token<Value> | Constructor<Value>, hint?: ResolveHint): Value[] {
    return this.resolveAll(key, hint, [], new Set(), []);
  }
  async resolveAllAsyncRoot<Value>(
    key: Token<Value> | Constructor<Value>,
    hint?: ResolveHint,
  ): Promise<Value[]> {
    return this.resolveAllAsync(key, hint, [], new Set(), []);
  }
  private resolveAll<Value>(
    key: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: MaterializationFrame[],
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
      const hasConstraint = bindings.some((binding) => binding.constraint !== undefined);
      const selectionConstraintCtx = hasConstraint
        ? this.buildConstraintContext(pathLabels, materializationStack, hint)
        : undefined;
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
      const hasConstraint = bindings.some((binding) => binding.constraint !== undefined);
      const selectionConstraintCtx = hasConstraint
        ? this.buildConstraintContext(pathLabels, materializationStack, hint)
        : undefined;
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
    materializationStack: MaterializationFrame[],
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
  private resolve<Value>(
    key: Token<Value> | Constructor<Value>,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: MaterializationFrame[],
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
  private instantiateBinding(
    binding: Binding<unknown>,
    registryKey: RegistryKey,
    hint: ResolveHint | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: MaterializationFrame[],
  ): unknown {
    const cached = this.deps.scopeManager.getCached(binding);
    if (cached !== undefined) {
      return cached;
    }
    return this.deps.scopeManager.getOrCreate(binding, () => {
      const frame = bindingToMaterializationFrame(registryKey, binding);
      materializationStack.push(frame);
      const ctx =
        binding.kind === "dynamic"
          ? this.createContext(pathLabels, visiting, materializationStack, hint)
          : undefined;
      const instance = this.materialize(
        binding,
        hint,
        ctx,
        pathLabels,
        visiting,
        materializationStack,
      );
      if (binding.kind === "class") {
        runPostConstruct(binding.implementationClass, instance, pathLabels);
      }
      let result: unknown;
      if (binding.onActivation !== undefined) {
        const activationCtx =
          ctx ?? this.createContext(pathLabels, visiting, materializationStack, hint);
        result = runActivation(binding, instance, activationCtx, pathLabels);
      } else {
        result = instance;
      }
      materializationStack.pop();
      return result;
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
      return await runActivationAsync(binding, instance, ctx);
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
      return await runActivationAsync(binding, instance, ctx);
    });
  }
  private materialize(
    binding: Binding<unknown>,
    hint: ResolveHint | undefined,
    ctx: ResolutionContext | undefined,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: MaterializationFrame[],
  ): unknown {
    switch (binding.kind) {
      case "constant":
        return binding.value;
      case "class":
        return this.instantiateClassBinding(binding, pathLabels, visiting, materializationStack);
      case "dynamic": {
        const factoryResult = binding.factory(ctx as ResolutionContext);
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
    binding: Extract<
      Binding<unknown>,
      {
        kind: "class";
      }
    >,
    pathLabels: string[],
    visiting: Set<RegistryKey>,
    materializationStack: MaterializationFrame[],
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
  private async instantiateClassBindingAsync(
    binding: Extract<
      Binding<unknown>,
      {
        kind: "class";
      }
    >,
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
