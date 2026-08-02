import type { Binding } from "#/binding";
import { AsyncActivationError, AsyncDeactivationError } from "#/errors";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type { ActivationHandler, Constructor, DeactivationHandler, DependencyKey, ResolutionContext } from "#/types";

/**
 * @since 0.3.16-canary.0
 */
export class LifecycleManager {
  // Container-level activation/deactivation hooks per token — most containers register none, so
  // both tables stay unallocated until the first hook arrives.
  #activationHooks: Map<DependencyKey, Array<ActivationHandler<unknown>>> | undefined;
  #deactivationHooks: Map<DependencyKey, Array<DeactivationHandler<unknown>>> | undefined;
  #activationVersion = 0;

  // One-entry cache in front of the map: a resolve loop asks about the same token over and over,
  // and registration is the only thing that can change the answer.
  #cachedToken: Token<unknown> | Constructor | undefined;
  #cachedHooks: Array<ActivationHandler<unknown>> | undefined;

  registerActivation<const Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void {
    this.#activationVersion += 1;
    this.#cachedToken = undefined;
    this.#cachedHooks = undefined;
    // ✓ TS6.0: Map.getOrInsert (ES2025)
    const list = (this.#activationHooks ??= new Map()).getOrInsert(token as DependencyKey, []);
    list.push(handler as ActivationHandler<unknown>);
  }

  hasActivationHandlers<const Value>(token: Token<Value> | Constructor<Value>): boolean {
    const list = this.activationHandlersFor(token);
    return list !== undefined && list.length > 0;
  }

  get activationVersion(): number {
    return this.#activationVersion;
  }

  /** Container-level activation handlers for a token — hot-path accessor, no copies. */
  activationHandlersFor<const Value>(
    token: Token<Value> | Constructor<Value>,
  ): ReadonlyArray<ActivationHandler<unknown>> | undefined {
    const hooks = this.#activationHooks;
    if (hooks === undefined) {
      return undefined;
    }
    const key = token as DependencyKey;
    if (key === this.#cachedToken) {
      return this.#cachedHooks;
    }
    const list = hooks.get(key);
    this.#cachedToken = key;
    this.#cachedHooks = list;
    return list;
  }

  registerDeactivation<const Value>(
    token: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void {
    const list = (this.#deactivationHooks ??= new Map()).getOrInsert(token as DependencyKey, []);
    list.push(handler as DeactivationHandler<unknown>);
  }

  async runActivation<const Value>(
    resolutionContext: ResolutionContext,
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Promise<Value> {
    let activatedInstance: Value = instance;

    // 1. @postConstruct() — after TC39 construction (constructor + accessor addInitializer callbacks)
    for (const methodName of lifecycleMethods(binding, metadataReader, "postConstruct")) {
      const hookResult = callHook(activatedInstance, methodName);
      if (hookResult instanceof Promise) {
        await hookResult;
      }
    }

    // 2. per-binding onActivation
    if (binding.kind !== "alias" && binding.onActivation !== undefined) {
      const activationResult = binding.onActivation(resolutionContext, activatedInstance);
      activatedInstance = activationResult instanceof Promise ? await activationResult : activationResult;
    }

    // 3. container-level onActivation
    const containerHooks = this.#activationHooks?.get(binding.token as DependencyKey);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const activationResult = hook(resolutionContext, activatedInstance);
        activatedInstance = (activationResult instanceof Promise ? await activationResult : activationResult) as Value;
      }
    }

    return activatedInstance;
  }

  runActivationSync<const Value>(
    resolutionContext: ResolutionContext,
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Value {
    let activatedInstance: Value = instance;

    // 1. @postConstruct() — must be sync (instance fully constructed per TC39 order)
    for (const methodName of lifecycleMethods(binding, metadataReader, "postConstruct")) {
      if (callHook(activatedInstance, methodName) instanceof Promise) {
        throw new AsyncActivationError(tokenName(binding.token), "postConstruct", methodName);
      }
    }

    // 2. per-binding onActivation (must be sync)
    if (binding.kind !== "alias" && binding.onActivation !== undefined) {
      const activationResult = binding.onActivation(resolutionContext, activatedInstance);
      if (activationResult instanceof Promise) {
        throw new AsyncActivationError(tokenName(binding.token), "onActivation");
      }
      activatedInstance = activationResult;
    }

    // 3. container-level onActivation (must be sync)
    const tokenDisplayName = tokenName(binding.token);
    const containerHooks = this.#activationHooks?.get(binding.token as DependencyKey);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const activationResult = hook(resolutionContext, activatedInstance);
        if (activationResult instanceof Promise) {
          throw new AsyncActivationError(tokenDisplayName, "onActivation");
        }
        activatedInstance = activationResult as Value;
      }
    }

    return activatedInstance;
  }

  async runDeactivation<const Value>(
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Promise<void> {
    const tokenKey = binding.token as DependencyKey;

    // 1. container-level onDeactivation
    const containerHooks = this.#deactivationHooks?.get(tokenKey);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const hookResult = hook(instance);
        if (hookResult instanceof Promise) {
          await hookResult;
        }
      }
    }

    // 2. per-binding onDeactivation
    if (binding.kind !== "alias" && binding.onDeactivation !== undefined) {
      const hookResult = binding.onDeactivation(instance);
      if (hookResult instanceof Promise) {
        await hookResult;
      }
    }

    // 3. @preDestroy() — all methods in declaration order
    for (const methodName of lifecycleMethods(binding, metadataReader, "preDestroy")) {
      const hookResult = callHook(instance, methodName);
      if (hookResult instanceof Promise) {
        await hookResult;
      }
    }
  }

  runDeactivationSync<const Value>(binding: Binding<Value>, instance: Value, metadataReader: MetadataReader): void {
    const tokenDisplayName = tokenName(binding.token);
    const tokenKey = binding.token as DependencyKey;

    // 1. container-level onDeactivation
    const containerHooks = this.#deactivationHooks?.get(tokenKey);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const hookResult = hook(instance);
        if (hookResult instanceof Promise) {
          throw new AsyncDeactivationError(tokenDisplayName);
        }
      }
    }

    // 2. per-binding onDeactivation
    if (binding.kind !== "alias" && binding.onDeactivation !== undefined) {
      const hookResult = binding.onDeactivation(instance);
      if (hookResult instanceof Promise) {
        throw new AsyncDeactivationError(tokenDisplayName);
      }
    }

    // 3. @preDestroy()
    for (const methodName of lifecycleMethods(binding, metadataReader, "preDestroy")) {
      if (callHook(instance, methodName) instanceof Promise) {
        throw new AsyncDeactivationError(tokenDisplayName);
      }
    }
  }

  /** Whether the deferred table behind `#activationHooks` has had to be built. */
  get isBuilt(): boolean {
    return this.#activationHooks !== undefined;
  }
}

const NO_METHODS: ReadonlyArray<string> = [];

/** The `@postConstruct` / `@preDestroy` methods a binding declares — only a class can declare any. */
function lifecycleMethods<const Value>(
  binding: Binding<Value>,
  metadataReader: MetadataReader,
  phase: "postConstruct" | "preDestroy",
): ReadonlyArray<string> {
  if (binding.kind !== "class") {
    return NO_METHODS;
  }
  return metadataReader.getLifecycleMetadata(binding.target)?.[phase] ?? NO_METHODS;
}

/** Invokes a hook by name, tolerating a name whose member is not (or no longer) a method. */
function callHook(instance: unknown, methodName: string): unknown {
  if (typeof instance !== "object" || instance === null) {
    return undefined;
  }
  const method: unknown = Reflect.get(instance, methodName);

  return typeof method === "function" ? method.call(instance) : undefined;
}
