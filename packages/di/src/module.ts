import type { BindingBuilder } from "#/binding";
import type { Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * Builder passed to the setup callback of a synchronous {@link Module}.
 * Use `import()` to declare module dependencies (sync modules only —
 * passing an {@link AsyncModule} throws {@link InternalError}) and `bind()` to register tokens.
 *
 * `bind(key).to*(...)` uses slot-aware last-wins, exactly like {@link Container.bind}:
 * - same slot (`default`, same `whenNamed`, or same `whenTagged`) replaces the previous entry
 * - different slot appends another entry (for {@link Container.resolveAll})
 *
 * `whenNamed` / `whenTagged` / `when` can be chained before or after `to*()`;
 * both forms mutate the same binding entry.
 */
export type ModuleBuilder = {
  /**
   * Declares synchronous module dependencies to load before/alongside current setup.
   */
  readonly import: (...modules: Module[]) => void;
  /**
   * Starts binding registration for a token/constructor within this module setup pass.
   */
  readonly bind: <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value>;
};

/**
 * Builder passed to the setup callback of an {@link AsyncModule}.
 * Unlike {@link ModuleBuilder}, `import()` accepts both sync and async modules.
 * Async sub-imports are collected and awaited **after** the setup callback returns.
 */
export type AsyncModuleBuilder = {
  /**
   * Declares sync/async module dependencies to be loaded by the async module loader.
   */
  readonly import: (...modules: (Module | AsyncModule)[]) => void;
  /**
   * Starts binding registration for a token/constructor within this async module setup pass.
   */
  readonly bind: <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value>;
};

/**
 * Immutable description of a bundle of bindings. A {@link Module} holds no runtime state and the
 * same instance may be loaded into any number of containers independently (spec §7.3).
 *
 * The owning container is responsible for tracking which modules have been loaded and which
 * binding ids each module produced; the module itself never sees a container reference.
 */
export class Module {
  /**
   * Human-readable label used in error messages, graph output, and module-cycle diagnostics.
   */
  readonly name: string;
  /**
   * The user-supplied setup callback; invoked exactly once per `load()` call.
   */
  private readonly syncSetup: (builder: ModuleBuilder) => void;

  /**
   * @internal Use {@link Module.create} instead.
   */
  private constructor(name: string, syncSetup: (builder: ModuleBuilder) => void) {
    this.name = name;
    this.syncSetup = syncSetup;
  }

  /**
   * Defines a synchronous module.
   * @param name - Human-readable label used in error messages and debug output.
   * @param setup - Callback that registers bindings via the {@link ModuleBuilder}.
   */
  static create(name: string, setup: (builder: ModuleBuilder) => void): Module {
    return new Module(name, setup);
  }

  /**
   * Defines an async module — use when setup requires awaiting (e.g. reading config, dynamic imports).
   * Load with {@link Container.loadAsync} or {@link Container.fromModulesAsync}.
   */
  static createAsync(
    name: string,
    setup: (builder: AsyncModuleBuilder) => Promise<void>,
  ): AsyncModule {
    return new AsyncModule(name, setup);
  }

  /**
   * @internal Invoked by the container while loading this module.
   */
  runSyncSetup(builder: ModuleBuilder): void {
    this.syncSetup(builder);
  }
}

/**
 * An async module whose setup callback may `await` before registering bindings.
 * Prefer {@link Module.createAsync} over constructing this class directly.
 *
 * Load via `Container.loadAsync()` or `Container.fromModulesAsync()`;
 * passing an `AsyncModule` to the synchronous `Container.load()` throws
 * {@link AsyncModuleLoadError}.
 */
export class AsyncModule {
  /**
   * Human-readable label used in error messages and graph output.
   */
  readonly name: string;
  /**
   * The user-supplied async setup callback; invoked exactly once per `loadAsync()` call.
   */
  private readonly asyncSetup: (builder: AsyncModuleBuilder) => Promise<void>;

  constructor(name: string, asyncSetup: (builder: AsyncModuleBuilder) => Promise<void>) {
    this.name = name;
    this.asyncSetup = asyncSetup;
  }

  /**
   * @internal Invoked by the container while loading this module.
   */
  async runAsyncSetup(builder: AsyncModuleBuilder): Promise<void> {
    await this.asyncSetup(builder);
  }
}
