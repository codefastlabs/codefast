import type { Binding } from "#/core/binding";
import { NO_INSTANCE } from "#/core/binding";
import type { BindingIdentifier } from "#/core/types";
import { MissingScopeContextError } from "#/errors/errors";

/**
 * @since 0.3.16-canary.0
 */
export class ScopeManager {
  // Instances live on their binding (see ARCHITECTURE.md); this list only lets disposal and
  // `inspect()` enumerate them.
  #singletonBindings: Array<Binding<unknown>> | undefined;
  // In-flight promises for async singleton creation — only an async resolve ever needs it.
  #inflight: Map<BindingIdentifier, Promise<unknown>> | undefined;
  // Scoped cache — only a child container resolving a `scoped` binding ever needs it.
  #scoped: Map<BindingIdentifier, unknown> | undefined;

  readonly isChild: boolean;

  constructor(isChild = false) {
    this.isChild = isChild;
  }

  setSingleton<Value>(binding: Binding<Value>, instance: unknown): void {
    if (binding.instance === NO_INSTANCE) {
      (this.#singletonBindings ??= []).push(binding as Binding<unknown>);
    }
    binding.instance = instance;
  }

  /** Every binding in this container holding a cached singleton. */
  cachedSingletons(): ReadonlyArray<Binding<unknown>> {
    return this.#singletonBindings ?? EMPTY_BINDINGS;
  }

  deleteSingleton<Value>(binding: Binding<Value>): boolean {
    if (binding.instance === NO_INSTANCE) {
      return false;
    }
    binding.instance = NO_INSTANCE;
    const tracked = this.#singletonBindings;
    if (tracked !== undefined) {
      const index = tracked.indexOf(binding as Binding<unknown>);
      if (index !== -1) {
        tracked.splice(index, 1);
      }
    }
    return true;
  }

  getInflight(id: BindingIdentifier): Promise<unknown> | undefined {
    return this.#inflight?.get(id);
  }

  setInflight(id: BindingIdentifier, p: Promise<unknown>): void {
    (this.#inflight ??= new Map()).set(id, p);
  }

  clearInflight(id: BindingIdentifier): void {
    this.#inflight?.delete(id);
  }

  hasScoped(id: BindingIdentifier): boolean {
    return this.#scoped !== undefined && this.#scoped.has(id);
  }

  getScoped<Value>(id: BindingIdentifier): Value {
    return this.#scoped?.get(id) as Value;
  }

  setScoped(id: BindingIdentifier, instance: unknown): void {
    if (!this.isChild) {
      throw new MissingScopeContextError("(unknown)");
    }
    (this.#scoped ??= new Map()).set(id, instance);
  }

  /** Releases a removed binding's scoped instance — no deactivation, per SPEC §5.2. */
  deleteScoped(id: BindingIdentifier): void {
    this.#scoped?.delete(id);
  }

  /** Scoped instances currently cached — a structural count for diagnostics. */
  get scopedCount(): number {
    return this.#scoped?.size ?? 0;
  }

  clearAll(): void {
    const tracked = this.#singletonBindings;
    if (tracked !== undefined) {
      for (const binding of tracked) {
        binding.instance = NO_INSTANCE;
      }
      tracked.length = 0;
    }
    this.#inflight?.clear();
    this.#scoped?.clear();
  }
  /** Whether the deferred table behind `#scoped` has had to be built. */
  get isBuilt(): boolean {
    return this.#scoped !== undefined;
  }
}

const EMPTY_BINDINGS: ReadonlyArray<Binding<unknown>> = [];
