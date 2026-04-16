import type { BindingBuilder } from "#lib/binding";
import type { BindingIdentifier } from "#lib/binding";
import type { Constructor } from "#lib/binding";
import type { DefaultContainer } from "#lib/container";
import { DiError } from "#lib/errors";
import type { Token } from "#lib/token";

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

abstract class ModuleBase {
  readonly name: string;
  private loadState: "idle" | "loaded" = "idle";
  private loadedContainer: DefaultContainer | undefined;
  private readonly ownedBindingIds: BindingIdentifier[] = [];

  protected constructor(name: string) {
    this.name = name;
  }

  isLoadedOn(container: DefaultContainer): boolean {
    return this.loadState === "loaded" && this.loadedContainer === container;
  }

  assertNotLoadedOnOtherContainer(container: DefaultContainer): void {
    if (
      this.loadState === "loaded" &&
      this.loadedContainer !== undefined &&
      this.loadedContainer !== container
    ) {
      throw new DiError(`Module "${this.name}" is already loaded on another container.`);
    }
  }

  markLoaded(container: DefaultContainer): void {
    this.loadState = "loaded";
    this.loadedContainer = container;
  }

  recordOwnedBinding(id: BindingIdentifier): void {
    this.ownedBindingIds.push(id);
  }

  getOwnedBindingIds(): readonly BindingIdentifier[] {
    return this.ownedBindingIds;
  }

  clearAfterUnload(): void {
    this.loadState = "idle";
    this.loadedContainer = undefined;
    this.ownedBindingIds.length = 0;
  }
}

export class Module extends ModuleBase {
  private readonly syncSetup: (api: ModuleBuilder) => void;

  private constructor(name: string, syncSetup: (api: ModuleBuilder) => void) {
    super(name);
    this.syncSetup = syncSetup;
  }

  static create(name: string, setup: (api: ModuleBuilder) => void): Module {
    return new Module(name, setup);
  }

  static createAsync(name: string, setup: (api: AsyncModuleBuilder) => Promise<void>): AsyncModule {
    return new AsyncModule(name, setup);
  }

  /**
   * @internal Invoked by the container while loading this module.
   */
  runSyncSetup(api: ModuleBuilder): void {
    this.syncSetup(api);
  }
}

export class AsyncModule extends ModuleBase {
  private readonly asyncSetup: (api: AsyncModuleBuilder) => Promise<void>;

  constructor(name: string, asyncSetup: (api: AsyncModuleBuilder) => Promise<void>) {
    super(name);
    this.asyncSetup = asyncSetup;
  }

  /**
   * @internal Invoked by the container while loading this module.
   */
  async runAsyncSetup(api: AsyncModuleBuilder): Promise<void> {
    await this.asyncSetup(api);
  }
}
