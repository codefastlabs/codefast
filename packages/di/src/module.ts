import type { BindingBuilder } from "#/binding";
import type { Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * Builder passed to the setup callback of a synchronous {@link Module}.
 * Use `import()` to declare module dependencies (sync modules only —
 * passing an {@link AsyncModule} throws {@link InternalError}) and `bind()` to register tokens.
 *
 * **Single slot (last-wins)** — `bind(key).to*(...)` with no `whenNamed` / `whenTagged` / `when`
 * *before* the `to*()` call replaces all prior bindings for `key` from this module pass.
 *
 * **Multi-binding** — put at least one disambiguator *before* `to*()` (e.g.
 * `bind(key).whenNamed("a").to*(...)`, `whenTagged` before `to*()`, or `when` before `to*()`).
 * Each such line **appends** another binding so {@link Container.resolveAll} can return every
 * implementation. Use this order in modules; chaining `.to*(...).whenNamed()` only updates that
 * binding in place and does not stack multiple registrations across lines.
 */
export type ModuleBuilder = {
  readonly import: (...modules: Module[]) => void;
  readonly bind: <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value>;
};

/**
 * Builder passed to the setup callback of an {@link AsyncModule}.
 * Unlike {@link ModuleBuilder}, `import()` accepts both sync and async modules.
 * Async sub-imports are collected and awaited **after** the setup callback returns.
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
