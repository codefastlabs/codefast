import type {
  ActivationHandler,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
} from "#/types";
import type { Token } from "#/token";
import type { Binding } from "#/binding";
import type { MetadataReader } from "#/metadata/metadata-types";
import { AsyncActivationError, AsyncDeactivationError } from "#/errors";
import { tokenName } from "#/token";

/**
 * @since 0.3.16-canary.0
 */
export class LifecycleManager {
  // Container-level activation/deactivation hooks per token
  private readonly _activationHooks = new Map<
    Token<unknown> | Constructor,
    Array<ActivationHandler<unknown>>
  >();
  private readonly _deactivationHooks = new Map<
    Token<unknown> | Constructor,
    Array<DeactivationHandler<unknown>>
  >();
  private _activationVersion = 0;

  registerActivation<const Value>(
    token: Token<Value> | Constructor<Value>,
    handler: ActivationHandler<Value>,
  ): void {
    this._activationVersion += 1;
    let list = this._activationHooks.get(token as Token<unknown> | Constructor);
    if (list === undefined) {
      list = [];
      this._activationHooks.set(token as Token<unknown> | Constructor, list);
    }
    list.push(handler as ActivationHandler<unknown>);
  }

  hasActivationHandlers<const Value>(token: Token<Value> | Constructor<Value>): boolean {
    if (this._activationHooks.size === 0) {
      return false;
    }
    const list = this._activationHooks.get(token as Token<unknown> | Constructor);
    return list !== undefined && list.length > 0;
  }

  get activationVersion(): number {
    return this._activationVersion;
  }

  registerDeactivation<const Value>(
    token: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void {
    let list = this._deactivationHooks.get(token as Token<unknown> | Constructor);
    if (list === undefined) {
      list = [];
      this._deactivationHooks.set(token as Token<unknown> | Constructor, list);
    }
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
      activatedInstance =
        activationResult instanceof Promise ? await activationResult : activationResult;
    }

    // 3. container-level onActivation
    const containerHooks = this._activationHooks.get(binding.token as Token<unknown> | Constructor);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const activationResult = hook(resolutionContext, activatedInstance);
        activatedInstance = (
          activationResult instanceof Promise ? await activationResult : activationResult
        ) as Value;
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
    const containerHooks = this._activationHooks.get(binding.token as Token<unknown> | Constructor);
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
    const containerHooks = this._deactivationHooks.get(tokenKey);
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

  runDeactivationSync<const Value>(
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): void {
    const tokenDisplayName = tokenName(binding.token);
    const tokenKey = binding.token as Token<unknown> | Constructor;

    // 1. container-level onDeactivation
    const containerHooks = this._deactivationHooks.get(tokenKey);
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
