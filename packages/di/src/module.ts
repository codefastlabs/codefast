import type { BindingBuilder } from "#/binding";
import type { Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * Builder passed to synchronous module setup: register bindings and import other sync modules.
 */
export type ModuleBuilder = {
  readonly import: (...modules: Module[]) => void;
  readonly bind: <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value>;
};

/**
 * Builder passed to async module setup.
 */
export type AsyncModuleBuilder = {
  readonly import: (...modules: (Module | AsyncModule)[]) => void;
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
  readonly name: string;
  private readonly syncSetup: (builder: ModuleBuilder) => void;

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
 */
export class AsyncModule {
  readonly name: string;
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
