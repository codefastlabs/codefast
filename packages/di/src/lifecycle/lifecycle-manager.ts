import type { Binding } from "#/core/binding";
import { producesOwnInstance, producingClassOf } from "#/core/lifecycle-declarations";
import type { Token } from "#/core/token";
import { tokenName } from "#/core/token";
import type {
  ActivationHandler,
  Constructor,
  DeactivationHandler,
  DependencyKey,
  ResolutionContext,
} from "#/core/types";
import { AsyncActivationError, AsyncDeactivationError, InvalidMetadataError } from "#/errors/errors";
import type { MetadataReader } from "#/metadata/metadata-types";

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

  registerActivation<Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void {
    this.#activationVersion += 1;
    this.#cachedToken = undefined;
    this.#cachedHooks = undefined;
    const list = (this.#activationHooks ??= new Map()).getOrInsert(token, []);
    list.push(handler as ActivationHandler<unknown>);
  }

  hasActivationHandlers<Value>(token: Token<Value> | Constructor<Value>): boolean {
    const list = this.activationHandlersFor(token);
    return list !== undefined && list.length > 0;
  }

  get activationVersion(): number {
    return this.#activationVersion;
  }

  /** Container-level activation handlers for a token — hot-path accessor, no copies. */
  activationHandlersFor<Value>(
    token: Token<Value> | Constructor<Value>,
  ): ReadonlyArray<ActivationHandler<unknown>> | undefined {
    const hooks = this.#activationHooks;
    if (hooks === undefined) {
      return undefined;
    }
    const key: DependencyKey = token;
    if (key === this.#cachedToken) {
      return this.#cachedHooks;
    }
    const list = hooks.get(key);
    this.#cachedToken = key;
    this.#cachedHooks = list;
    return list;
  }

  registerDeactivation<Value>(token: Token<Value> | Constructor<Value>, handler: DeactivationHandler<Value>): void {
    const list = (this.#deactivationHooks ??= new Map()).getOrInsert(token, []);
    list.push(handler as DeactivationHandler<unknown>);
  }

  /** Asked only while tearing down, so it reads the map directly rather than caching like activation. */
  hasDeactivationHandlers<Value>(token: Token<Value> | Constructor<Value>): boolean {
    const list = this.#deactivationHooks?.get(token);
    return list !== undefined && list.length > 0;
  }

  /** Every token carrying a container-level hook, paired with the phase that registered it. */
  hookedTokens(): Array<[DependencyKey, "onActivation" | "onDeactivation"]> {
    const hooked: Array<[DependencyKey, "onActivation" | "onDeactivation"]> = [];
    for (const key of this.#activationHooks?.keys() ?? []) {
      hooked.push([key, "onActivation"]);
    }
    for (const key of this.#deactivationHooks?.keys() ?? []) {
      hooked.push([key, "onDeactivation"]);
    }
    return hooked;
  }

  /**
   * The `@postConstruct` methods declared by the class a factory just returned.
   *
   * @remarks Callers gate on {@link anyLifecycleMethodDeclared} first — that boolean is the entire
   * cost where nothing declares a hook, which is what keeps the specialised lanes lean. The class is
   * read off the instance and memoized on the binding, so a factory returning the same class every
   * time pays one identity check rather than a metadata lookup per resolve.
   */
  producedPostConstructMethods<Value>(
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): ReadonlyArray<string> | undefined {
    // A class binding's hooks are already known from its target, and a constant was built by the
    // caller — only a factory leaves its class to be discovered here.
    if (!producesOwnInstance(binding)) {
      return undefined;
    }
    const producedClass = producingClassOf(instance);
    if (producedClass === undefined) {
      return undefined;
    }
    if (binding.producedClass !== producedClass) {
      binding.producedClass = producedClass;
      binding.producedPostConstruct = metadataReader.getLifecycleMetadata(producedClass)?.postConstruct;
    }
    return binding.producedPostConstruct;
  }

  /** Runs a factory-built instance's `@postConstruct` on a lane that skipped the pipeline. */
  runProducedPostConstructSync<Value>(binding: Binding<Value>, instance: Value, metadataReader: MetadataReader): void {
    const methods = this.producedPostConstructMethods(binding, instance, metadataReader);
    if (methods === undefined) {
      return;
    }
    for (const methodName of methods) {
      if (callHook(instance, methodName) instanceof Promise) {
        throw new AsyncActivationError(tokenName(binding.token), "postConstruct", methodName);
      }
    }
  }

  /** The async twin, for a lane whose value arrives as a promise. */
  async runProducedPostConstruct<Value>(
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Promise<void> {
    const methods = this.producedPostConstructMethods(binding, instance, metadataReader);
    if (methods === undefined) {
      return;
    }
    for (const methodName of methods) {
      const hookResult = callHook(instance, methodName);
      if (hookResult instanceof Promise) {
        await hookResult;
      }
    }
  }

  async runActivation<Value>(
    resolutionContext: ResolutionContext,
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Promise<Value> {
    let activatedInstance: Value = instance;

    // 1. @postConstruct() — after TC39 construction (constructor + accessor addInitializer callbacks)
    for (const methodName of lifecycleMethods(binding, activatedInstance, metadataReader, "postConstruct")) {
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
    const containerHooks = this.#activationHooks?.get(binding.token);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const activationResult = hook(resolutionContext, activatedInstance);
        activatedInstance = (activationResult instanceof Promise ? await activationResult : activationResult) as Value;
      }
    }

    return activatedInstance;
  }

  runActivationSync<Value>(
    resolutionContext: ResolutionContext,
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Value {
    let activatedInstance: Value = instance;

    // 1. @postConstruct() — must be sync (instance fully constructed per TC39 order)
    for (const methodName of lifecycleMethods(binding, activatedInstance, metadataReader, "postConstruct")) {
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
    const containerHooks = this.#activationHooks?.get(binding.token);
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

  async runDeactivation<Value>(
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Promise<void> {
    const tokenKey: DependencyKey = binding.token;

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
    for (const methodName of lifecycleMethods(binding, instance, metadataReader, "preDestroy")) {
      const hookResult = callHook(instance, methodName);
      if (hookResult instanceof Promise) {
        await hookResult;
      }
    }
  }

  runDeactivationSync<Value>(binding: Binding<Value>, instance: Value, metadataReader: MetadataReader): void {
    const tokenDisplayName = tokenName(binding.token);
    const tokenKey: DependencyKey = binding.token;

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
    for (const methodName of lifecycleMethods(binding, instance, metadataReader, "preDestroy")) {
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

/**
 * The `@postConstruct` / `@preDestroy` methods that apply to one instance.
 *
 * @remarks A factory names no class, so the instance it returned is the only place one can be read.
 * An alias is excluded because it produces nothing of its own — the binding it points at ran these
 * already, and reading them here would run every hook a second time.
 */
function lifecycleMethods<Value>(
  binding: Binding<Value>,
  instance: Value,
  metadataReader: MetadataReader,
  phase: "postConstruct" | "preDestroy",
): ReadonlyArray<string> {
  if (binding.kind === "alias") {
    return NO_METHODS;
  }
  const declaringClass = binding.kind === "class" ? binding.target : producingClassOf(instance);
  if (declaringClass === undefined) {
    return NO_METHODS;
  }
  return metadataReader.getLifecycleMetadata(declaringClass)?.[phase] ?? NO_METHODS;
}

/**
 * Invokes a lifecycle hook by name.
 *
 * @remarks A name that is not a method can only come from a {@link MetadataReader} that answered
 * wrongly, so it is reported rather than skipped — a hook that never runs is the failure a caller
 * cannot see. A non-object instance has no hooks to run and is not an error.
 */
function callHook(instance: unknown, methodName: string): unknown {
  if (typeof instance !== "object" || instance === null) {
    return undefined;
  }
  const method: unknown = Reflect.get(instance, methodName);
  if (typeof method !== "function") {
    // The class is derived here rather than passed in, so the happy path carries no extra argument.
    const constructor: unknown = Reflect.get(instance, "constructor");
    const className = typeof constructor === "function" && constructor.name !== "" ? constructor.name : "(anonymous)";
    throw new InvalidMetadataError(className, `lifecycle method '${methodName}' is not a method on the instance`);
  }

  return method.call(instance);
}
