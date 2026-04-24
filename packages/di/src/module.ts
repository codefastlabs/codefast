import type { BindingBuilder } from "#/binding";
import type { Constructor } from "#/binding";
import type { Token } from "#/token";
export type ModuleBuilder = {
  readonly import: (...modules: Module[]) => void;
  readonly bind: <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value>;
};
export type AsyncModuleBuilder = {
  readonly import: (...modules: (Module | AsyncModule)[]) => void;
  readonly bind: <Value>(key: Token<Value> | Constructor<Value>) => BindingBuilder<Value>;
};
export class Module {
  readonly name: string;
  private readonly syncSetup: (builder: ModuleBuilder) => void;
  private constructor(name: string, syncSetup: (builder: ModuleBuilder) => void) {
    this.name = name;
    this.syncSetup = syncSetup;
  }
  static create(name: string, setup: (builder: ModuleBuilder) => void): Module {
    return new Module(name, setup);
  }
  static createAsync(
    name: string,
    setup: (builder: AsyncModuleBuilder) => Promise<void>,
  ): AsyncModule {
    return new AsyncModule(name, setup);
  }
  runSyncSetup(builder: ModuleBuilder): void {
    this.syncSetup(builder);
  }
}
export class AsyncModule {
  readonly name: string;
  private readonly asyncSetup: (builder: AsyncModuleBuilder) => Promise<void>;
  constructor(name: string, asyncSetup: (builder: AsyncModuleBuilder) => Promise<void>) {
    this.name = name;
    this.asyncSetup = asyncSetup;
  }
  async runAsyncSetup(builder: AsyncModuleBuilder): Promise<void> {
    await this.asyncSetup(builder);
  }
}
