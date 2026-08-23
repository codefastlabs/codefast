import type { BindToBuilder } from "#/core/binding";
import type { Token } from "#/core/token";
import type { Constructor } from "#/core/types";

// ── Branded types (runtime symbols for branding) ─────────────────────────────────────────────────────────────────────

const SYNC_MODULE_BRAND: unique symbol = Symbol("di:sync-module");
const ASYNC_MODULE_BRAND: unique symbol = Symbol("di:async-module");

/**
 * Key for the module's setup callback. A symbol (not exported from the package root)
 * keeps the container-only member out of consumer-facing autocomplete entirely.
 *
 * @since 0.5.0-canary.7
 */
export const MODULE_SETUP: unique symbol = Symbol("di:module-setup");

/**
 * A named, reusable group of bindings a container applies synchronously via `load()`.
 *
 * @since 0.3.16-canary.0
 */
export interface SyncModule {
  readonly name: string;
  readonly [SYNC_MODULE_BRAND]: true;
  readonly [MODULE_SETUP]: (builder: ModuleBuilder) => void;
}

/**
 * A named group of bindings whose setup is async, applied via `loadAsync()`.
 *
 * @since 0.3.16-canary.0
 */
export interface AsyncModule {
  readonly name: string;
  readonly [ASYNC_MODULE_BRAND]: true;
  readonly [MODULE_SETUP]: (builder: AsyncModuleBuilder) => Promise<void>;
}

// ── Builder interfaces ───────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The binding surface a sync module's setup callback receives.
 *
 * @since 0.3.16-canary.0
 */
export interface ModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: Array<SyncModule>): void;
}

/**
 * The binding surface an async module's setup callback receives; its `import` accepts async modules too.
 *
 * @since 0.3.16-canary.0
 */
export interface AsyncModuleBuilder {
  bind<Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: Array<SyncModule | AsyncModule>): void;
}

// ── Static factories ─────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The companion factory that creates `SyncModule` values.
 *
 * @since 0.3.16-canary.0
 */
export const SyncModule = {
  create(name: string, setup: (builder: ModuleBuilder) => void): SyncModule {
    return {
      name,
      [SYNC_MODULE_BRAND]: true as const,
      [MODULE_SETUP]: setup,
    };
  },
};

/**
 * The companion factory that creates `AsyncModule` values.
 *
 * @since 0.3.16-canary.0
 */
export const AsyncModule = {
  create(name: string, setup: (builder: AsyncModuleBuilder) => Promise<void>): AsyncModule {
    return {
      name,
      [ASYNC_MODULE_BRAND]: true as const,
      [MODULE_SETUP]: setup,
    };
  },
};

// ── Module — unified API ─────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The unified module factory — `create` for sync modules, `createAsync` for async ones.
 *
 * @since 0.3.16-canary.0
 */
export const Module = {
  create(name: string, setup: (builder: ModuleBuilder) => void): SyncModule {
    return SyncModule.create(name, setup);
  },
  createAsync(name: string, setup: (builder: AsyncModuleBuilder) => Promise<void>): AsyncModule {
    return AsyncModule.create(name, setup);
  },
};

/**
 * Narrows a module union to `SyncModule` by checking its brand.
 *
 * @since 0.3.16-canary.0
 */
export function isSyncModule(module: SyncModule | AsyncModule): module is SyncModule {
  return (module as Partial<SyncModule>)[SYNC_MODULE_BRAND] === true;
}
