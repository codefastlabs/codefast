import type { Binding, BindingIdentifier, Constructor } from "#binding";
import type { Token } from "#token";

/**
 * Key used to group {@link Binding} instances in the registry (reference equality for tokens).
 */
export type RegistryKey = Token<unknown> | Constructor<unknown>;

/**
 * Dumb storage for bindings keyed by token or constructor. Selection and construction logic live elsewhere.
 */
export class BindingRegistry {
  private readonly store = new Map<RegistryKey, Binding<unknown>[]>();

  add<Value>(key: Token<Value> | Constructor<Value>, binding: Binding<Value>): void {
    const registryKey = key as RegistryKey;
    const nextBinding = binding as Binding<unknown>;
    const existing = this.store.get(registryKey);
    const merged = existing === undefined ? [nextBinding] : [...existing, nextBinding];
    this.store.set(registryKey, merged);
  }

  get<Value>(key: Token<Value> | Constructor<Value>): readonly Binding<Value>[] | undefined {
    const found = this.store.get(key as RegistryKey);
    return found as readonly Binding<Value>[] | undefined;
  }

  remove(key: RegistryKey): void {
    this.store.delete(key);
  }

  /**
   * Returns owned registry rows (does not include parent containers).
   */
  listEntries(): readonly { key: RegistryKey; bindings: readonly Binding<unknown>[] }[] {
    return [...this.store.entries()].map(([key, bindings]) => ({ key, bindings }));
  }

  removeById(id: BindingIdentifier): void {
    for (const [registryKey, list] of [...this.store.entries()]) {
      const filtered = list.filter((binding) => binding.id !== id);
      if (filtered.length === list.length) {
        continue;
      }
      if (filtered.length === 0) {
        this.store.delete(registryKey);
      } else {
        this.store.set(registryKey, filtered);
      }
    }
  }

  replaceById(id: BindingIdentifier, next: Binding<unknown>): void {
    for (const [registryKey, list] of this.store.entries()) {
      const index = list.findIndex((binding) => binding.id === id);
      if (index === -1) {
        continue;
      }
      const updated = [...list];
      updated[index] = next;
      this.store.set(registryKey, updated);
      return;
    }
  }

  /**
   * Replaces all bindings for `key` with a single binding (module "last-wins" semantics).
   * Invokes `onReplaced` for every removed binding so scopes can run deactivation.
   */
  replaceKeyLastWins<Value>(
    key: Token<Value> | Constructor<Value>,
    binding: Binding<Value>,
    onReplaced: (removed: Binding<unknown>) => void,
  ): void {
    const registryKey = key as RegistryKey;
    const nextBinding = binding as Binding<unknown>;
    const existing = this.store.get(registryKey);
    if (existing !== undefined) {
      for (const removed of existing) {
        onReplaced(removed);
      }
    }
    this.store.set(registryKey, [nextBinding]);
  }
}
