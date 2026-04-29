import type { BindingIdentifier } from "#/types";
import { MissingScopeContextError } from "#/errors";

export class ScopeManager {
  // Singleton cache: bindingId -> instance
  private readonly _singletons = new Map<BindingIdentifier, unknown>();
  // In-flight promises for async singleton creation
  private readonly _inflight = new Map<BindingIdentifier, Promise<unknown>>();
  // Scoped cache (for child containers): bindingId -> instance
  private readonly _scoped = new Map<BindingIdentifier, unknown>();

  readonly isChild: boolean;

  constructor(isChild = false) {
    this.isChild = isChild;
  }

  hasSingleton(id: BindingIdentifier): boolean {
    return this._singletons.has(id);
  }

  getSingleton<Value>(id: BindingIdentifier): Value {
    return this._singletons.get(id) as Value;
  }

  setSingleton(id: BindingIdentifier, instance: unknown): void {
    this._singletons.set(id, instance);
  }

  deleteSingleton(id: BindingIdentifier): boolean {
    return this._singletons.delete(id);
  }

  getAllSingletons(): ReadonlyMap<BindingIdentifier, unknown> {
    return this._singletons;
  }

  getInflight(id: BindingIdentifier): Promise<unknown> | undefined {
    return this._inflight.get(id);
  }

  setInflight(id: BindingIdentifier, p: Promise<unknown>): void {
    this._inflight.set(id, p);
  }

  clearInflight(id: BindingIdentifier): void {
    this._inflight.delete(id);
  }

  hasScoped(id: BindingIdentifier): boolean {
    return this._scoped.has(id);
  }

  getScoped<Value>(id: BindingIdentifier): Value {
    return this._scoped.get(id) as Value;
  }

  setScoped(id: BindingIdentifier, instance: unknown): void {
    if (!this.isChild) {
      throw new MissingScopeContextError("(unknown)");
    }
    this._scoped.set(id, instance);
  }

  getAllScoped(): ReadonlyMap<BindingIdentifier, unknown> {
    return this._scoped;
  }

  clearAll(): void {
    this._singletons.clear();
    this._inflight.clear();
    this._scoped.clear();
  }
}
