import type { Binding } from "#/binding";
import { AsyncActivationError, AsyncDeactivationError } from "#/errors";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type { ActivationHandler, Constructor, DeactivationHandler, ResolutionContext } from "#/types";

/**
 * @since 0.3.16-canary.0
 */
export class LifecycleManager {
  // Container-level activation/deactivation hooks per token
  readonly #activationHooks = new Map<Token<unknown> | Constructor, Array<ActivationHandler<unknown>>>();
  readonly #deactivationHooks = new Map<Token<unknown> | Constructor, Array<DeactivationHandler<unknown>>>();
  #activationVersion = 0;

  registerActivation<const Value>(token: Token<Value> | Constructor<Value>, handler: ActivationHandler<Value>): void {
    this.#activationVersion += 1;
    // ✓ TS6.0: Map.getOrInsert (ES2025)
    const list = this.#activationHooks.getOrInsert(token as Token<unknown> | Constructor, []);
    list.push(handler as ActivationHandler<unknown>);
  }

  hasActivationHandlers<const Value>(token: Token<Value> | Constructor<Value>): boolean {
    if (this.#activationHooks.size === 0) {
      return false;
    }
    const list = this.#activationHooks.get(token as Token<unknown> | Constructor);
    return list !== undefined && list.length > 0;
  }

  get activationVersion(): number {
    return this.#activationVersion;
  }

  /** Container-level activation handlers for a token — hot-path accessor, no copies. */
  activationHandlersFor<const Value>(
    token: Token<Value> | Constructor<Value>,
  ): ReadonlyArray<ActivationHandler<unknown>> | undefined {
    return this.#activationHooks.get(token as Token<unknown> | Constructor);
  }

  registerDeactivation<const Value>(
    token: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void {
    const list = this.#deactivationHooks.getOrInsert(token as Token<unknown> | Constructor, []);
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
    if (binding.kind === "class") {
      const lifecycle = metadataReader.getLifecycleMetadata(binding.target);
      if (lifecycle?.postConstruct && lifecycle.postConstruct.length > 0) {
        for (const methodName of lifecycle.postConstruct) {
          const method = (activatedInstance as Record<string, unknown>)[methodName];
          if (typeof method === "function") {
            const hookResult = (method as () => unknown).call(activatedInstance);
            if (hookResult instanceof Promise) {
              await hookResult;
            }
          }
        }
      }
    }

    // 2. per-binding onActivation
    if (binding.kind !== "alias" && binding.onActivation !== undefined) {
      const activationResult = binding.onActivation(resolutionContext, activatedInstance);
      activatedInstance = activationResult instanceof Promise ? await activationResult : activationResult;
    }

    // 3. container-level onActivation
    const containerHooks = this.#activationHooks.get(binding.token as Token<unknown> | Constructor);
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
    if (binding.kind === "class") {
      const lifecycle = metadataReader.getLifecycleMetadata(binding.target);
      if (lifecycle?.postConstruct && lifecycle.postConstruct.length > 0) {
        for (const methodName of lifecycle.postConstruct) {
          const method = (activatedInstance as Record<string, unknown>)[methodName];
          if (typeof method === "function") {
            const hookResult = (method as () => unknown).call(activatedInstance);
            if (hookResult instanceof Promise) {
              throw new AsyncActivationError(tokenName(binding.token), "postConstruct", methodName);
            }
          }
        }
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
    const containerHooks = this.#activationHooks.get(binding.token as Token<unknown> | Constructor);
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
    const tokenKey = binding.token as Token<unknown> | Constructor;

    // 1. container-level onDeactivation
    const containerHooks = this.#deactivationHooks.get(tokenKey);
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
    if (binding.kind === "class") {
      const lifecycle = metadataReader.getLifecycleMetadata(binding.target);
      if (lifecycle?.preDestroy && lifecycle.preDestroy.length > 0) {
        for (const methodName of lifecycle.preDestroy) {
          const method = (instance as Record<string, unknown>)[methodName];
          if (typeof method === "function") {
            const hookResult = (method as () => unknown).call(instance);
            if (hookResult instanceof Promise) {
              await hookResult;
            }
          }
        }
      }
    }
  }

  runDeactivationSync<const Value>(binding: Binding<Value>, instance: Value, metadataReader: MetadataReader): void {
    const tokenDisplayName = tokenName(binding.token);
    const tokenKey = binding.token as Token<unknown> | Constructor;

    // 1. container-level onDeactivation
    const containerHooks = this.#deactivationHooks.get(tokenKey);
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
    if (binding.kind === "class") {
      const lifecycle = metadataReader.getLifecycleMetadata(binding.target);
      if (lifecycle?.preDestroy && lifecycle.preDestroy.length > 0) {
        for (const methodName of lifecycle.preDestroy) {
          const method = (instance as Record<string, unknown>)[methodName];
          if (typeof method === "function") {
            const hookResult = (method as () => unknown).call(instance);
            if (hookResult instanceof Promise) {
              throw new AsyncDeactivationError(tokenDisplayName);
            }
          }
        }
      }
    }
  }
}
