import type { BindToBuilder } from "#/binding";
import type { Constructor } from "#/types";
import type { Token } from "#/token";

// ── Branded types (runtime symbols for branding) ─────────────────────────────

const SYNC_MODULE_BRAND: unique symbol = Symbol("di:sync-module");
const ASYNC_MODULE_BRAND: unique symbol = Symbol("di:async-module");

/**
 * @since 0.3.16-canary.0
 */
export interface SyncModule {
  readonly name: string;
  readonly [SYNC_MODULE_BRAND]: true;
  readonly _setup: (builder: ModuleBuilder) => void;
}

/**
 * @since 0.3.16-canary.0
 */
export interface AsyncModule {
  readonly name: string;
  readonly [ASYNC_MODULE_BRAND]: true;
  readonly _setup: (builder: AsyncModuleBuilder) => Promise<void>;
}

// ── Builder interfaces ────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface ModuleBuilder {
  bind<const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: Array<SyncModule>): void;
}

/**
 * @since 0.3.16-canary.0
 */
export interface AsyncModuleBuilder {
  bind<const Value>(token: Token<Value> | Constructor<Value>): BindToBuilder<Value>;
  import(...modules: Array<SyncModule | AsyncModule>): void;
}

// ── Static factories ──────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export const SyncModule = {
  create(name: string, setup: (builder: ModuleBuilder) => void): SyncModule {
    return {
      name,
      [SYNC_MODULE_BRAND]: true as const,
      _setup: setup,
    } as SyncModule;
  },
};

/**
 * @since 0.3.16-canary.0
 */
export const AsyncModule = {
  create(name: string, setup: (builder: AsyncModuleBuilder) => Promise<void>): AsyncModule {
    return {
      name,
      [ASYNC_MODULE_BRAND]: true as const,
      _setup: setup,
    } as AsyncModule;
  },
};

// ── Module — unified API ──────────────────────────────────────────────────────

/**
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
 * @since 0.3.16-canary.0
 */
export function isSyncModule(module: SyncModule | AsyncModule): module is SyncModule {
  return (module as SyncModule)[SYNC_MODULE_BRAND] === true;
}
