import type {
  ActivationHandler,
  Constructor,
  DeactivationHandler,
  ResolutionContext,
} from "#/types";
import type { Token } from "#/token";
import type { Binding } from "#/binding";
import type { MetadataReader } from "#/metadata/metadata-types";
import { AsyncDeactivationError } from "#/errors";
import { tokenName } from "#/token";

export class LifecycleManager {
  // Container-level activation/deactivation hooks per token
  private readonly _activationHooks = new Map<
    Token<unknown> | Constructor,
    ActivationHandler<unknown>[]
  >();
  private readonly _deactivationHooks = new Map<
    Token<unknown> | Constructor,
    DeactivationHandler<unknown>[]
  >();
  private _activationVersion = 0;

  registerActivation<Value>(
    t: Token<Value> | Constructor<Value>,
    handler: ActivationHandler<Value>,
  ): void {
    this._activationVersion += 1;
    let list = this._activationHooks.get(t as Token<unknown> | Constructor);
    if (list === undefined) {
      list = [];
      this._activationHooks.set(t as Token<unknown> | Constructor, list);
    }
    list.push(handler as ActivationHandler<unknown>);
  }

  hasActivationHandlers<Value>(t: Token<Value> | Constructor<Value>): boolean {
    const list = this._activationHooks.get(t as Token<unknown> | Constructor);
    return list !== undefined && list.length > 0;
  }

  get activationVersion(): number {
    return this._activationVersion;
  }

  registerDeactivation<Value>(
    t: Token<Value> | Constructor<Value>,
    handler: DeactivationHandler<Value>,
  ): void {
    let list = this._deactivationHooks.get(t as Token<unknown> | Constructor);
    if (list === undefined) {
      list = [];
      this._deactivationHooks.set(t as Token<unknown> | Constructor, list);
    }
    list.push(handler as DeactivationHandler<unknown>);
  }

  async runActivation<Value>(
    ctx: ResolutionContext,
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Promise<Value> {
    let result: Value = instance;

    // 1. @postConstruct() — all methods in declaration order
    if (binding.kind === "class") {
      const lifecycle = metadataReader.getLifecycleMetadata(binding.target);
      if (lifecycle?.postConstruct && lifecycle.postConstruct.length > 0) {
        for (const methodName of lifecycle.postConstruct) {
          const method = (result as Record<string, unknown>)[methodName];
          if (typeof method === "function") {
            const r = (method as () => unknown).call(result);
            if (r instanceof Promise) {
              await r;
            }
          }
        }
      }
    }

    // 2. per-binding onActivation
    if (binding.kind !== "alias" && binding.onActivation !== undefined) {
      const activated = binding.onActivation(ctx, result);
      result = activated instanceof Promise ? await activated : activated;
    }

    // 3. container-level onActivation
    const containerHooks = this._activationHooks.get(binding.token as Token<unknown> | Constructor);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const activated = hook(ctx, result);
        result = (activated instanceof Promise ? await activated : activated) as Value;
      }
    }

    return result;
  }

  runActivationSync<Value>(
    ctx: ResolutionContext,
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Value {
    let result: Value = instance;

    // 1. @postConstruct() — must be sync
    if (binding.kind === "class") {
      const lifecycle = metadataReader.getLifecycleMetadata(binding.target);
      if (lifecycle?.postConstruct && lifecycle.postConstruct.length > 0) {
        for (const methodName of lifecycle.postConstruct) {
          const method = (result as Record<string, unknown>)[methodName];
          if (typeof method === "function") {
            const r = (method as () => unknown).call(result);
            if (r instanceof Promise) {
              throw new Error(
                `@postConstruct method '${methodName}' returned a Promise. Use resolveAsync() instead.`,
              );
            }
          }
        }
      }
    }

    // 2. per-binding onActivation (must be sync)
    if (binding.kind !== "alias" && binding.onActivation !== undefined) {
      const activated = binding.onActivation(ctx, result);
      if (activated instanceof Promise) {
        throw new Error(
          `onActivation for '${tokenName(binding.token)}' returned a Promise. Use resolveAsync() instead.`,
        );
      }
      result = activated;
    }

    // 3. container-level onActivation (must be sync)
    const key = tokenName(binding.token);
    const containerHooks = this._activationHooks.get(binding.token as Token<unknown> | Constructor);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const activated = hook(ctx, result);
        if (activated instanceof Promise) {
          throw new Error(
            `Container-level onActivation for '${key}' returned a Promise. Use resolveAsync() instead.`,
          );
        }
        result = activated as Value;
      }
    }

    return result;
  }

  async runDeactivation<Value>(
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): Promise<void> {
    const key = binding.token as Token<unknown> | Constructor;

    // 1. container-level onDeactivation
    const containerHooks = this._deactivationHooks.get(key);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const r = hook(instance);
        if (r instanceof Promise) {
          await r;
        }
      }
    }

    // 2. per-binding onDeactivation
    if (binding.kind !== "alias" && binding.onDeactivation !== undefined) {
      const r = binding.onDeactivation(instance);
      if (r instanceof Promise) {
        await r;
      }
    }

    // 3. @preDestroy() — all methods in declaration order
    if (binding.kind === "class") {
      const lifecycle = metadataReader.getLifecycleMetadata(binding.target);
      if (lifecycle?.preDestroy && lifecycle.preDestroy.length > 0) {
        for (const methodName of lifecycle.preDestroy) {
          const method = (instance as Record<string, unknown>)[methodName];
          if (typeof method === "function") {
            const r = (method as () => unknown).call(instance);
            if (r instanceof Promise) {
              await r;
            }
          }
        }
      }
    }
  }

  runDeactivationSync<Value>(
    binding: Binding<Value>,
    instance: Value,
    metadataReader: MetadataReader,
  ): void {
    const tName = tokenName(binding.token);
    const key = binding.token as Token<unknown> | Constructor;

    // 1. container-level onDeactivation
    const containerHooks = this._deactivationHooks.get(key);
    if (containerHooks !== undefined) {
      for (const hook of containerHooks) {
        const r = hook(instance);
        if (r instanceof Promise) {
          throw new AsyncDeactivationError(tName);
        }
      }
    }

    // 2. per-binding onDeactivation
    if (binding.kind !== "alias" && binding.onDeactivation !== undefined) {
      const r = binding.onDeactivation(instance);
      if (r instanceof Promise) {
        throw new AsyncDeactivationError(tName);
      }
    }

    // 3. @preDestroy()
    if (binding.kind === "class") {
      const lifecycle = metadataReader.getLifecycleMetadata(binding.target);
      if (lifecycle?.preDestroy && lifecycle.preDestroy.length > 0) {
        for (const methodName of lifecycle.preDestroy) {
          const method = (instance as Record<string, unknown>)[methodName];
          if (typeof method === "function") {
            const r = (method as () => unknown).call(instance);
            if (r instanceof Promise) {
              throw new AsyncDeactivationError(tName);
            }
          }
        }
      }
    }
  }

  hasAsyncDeactivation<Value>(
    binding: Binding<Value>,
    instance: Value,
    _metadataReader: MetadataReader,
  ): boolean {
    if (binding.kind === "alias") {
      return false;
    }
    if (binding.onDeactivation !== undefined) {
      const r = binding.onDeactivation(instance);
      if (r instanceof Promise) {
        // Need to handle this promise though — just return true here
        void r;
        return true;
      }
    }
    return false;
  }
}
