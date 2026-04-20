import type { Binding, BindingIdentifier, Constructor } from "#/binding";
import type { Token } from "#/token";

/**
 * Key used to group {@link Binding} instances in the registry (reference equality for tokens).
 */
export type RegistryKey = Token<unknown> | Constructor<unknown>;

/**
 * Dumb storage for bindings keyed by token or constructor. Selection and construction logic live elsewhere.
 */
export class BindingRegistry {
  private readonly bindingsByKey = new Map<RegistryKey, Binding<unknown>[]>();

  /**
   * Appends `binding` to the list for `key` (multi-binding: each call adds an entry).
   */
  add<Value>(key: Token<Value> | Constructor<Value>, binding: Binding<Value>): void {
    const registryKey = key as RegistryKey;
    const nextBinding = binding as Binding<unknown>;
    const existing = this.bindingsByKey.get(registryKey);
    const merged = existing === undefined ? [nextBinding] : [...existing, nextBinding];
    this.bindingsByKey.set(registryKey, merged);
  }

  /**
   * Returns all bindings registered for `key`, or `undefined` if none exist.
   */
  get<Value>(key: Token<Value> | Constructor<Value>): readonly Binding<Value>[] | undefined {
    const found = this.bindingsByKey.get(key as RegistryKey);
    return found as readonly Binding<Value>[] | undefined;
  }

  /**
   * Removes all bindings for `key` without running any deactivation hooks.
   */
  remove(key: RegistryKey): void {
    this.bindingsByKey.delete(key);
  }

  /**
   * Returns owned registry rows (does not include parent containers).
   */
  listEntries(): readonly { key: RegistryKey; bindings: readonly Binding<unknown>[] }[] {
    return [...this.bindingsByKey.entries()].map(([key, bindings]) => ({ key, bindings }));
  }

  /**
   * Removes the single binding with the given `id` across all keys.
   */
  removeById(id: BindingIdentifier): void {
    for (const [registryKey, list] of [...this.bindingsByKey.entries()]) {
      const filtered = list.filter((binding) => binding.id !== id);
      if (filtered.length === list.length) {
        continue;
      }
      if (filtered.length === 0) {
        this.bindingsByKey.delete(registryKey);
      } else {
        this.bindingsByKey.set(registryKey, filtered);
      }
    }
  }

  /**
   * Swaps the binding with the given `id` in place, preserving its position in the list.
   */
  replaceById(id: BindingIdentifier, next: Binding<unknown>): void {
    for (const [registryKey, list] of this.bindingsByKey.entries()) {
      const index = list.findIndex((binding) => binding.id === id);
      if (index === -1) {
        continue;
      }
      const updated = [...list];
      updated[index] = next;
      this.bindingsByKey.set(registryKey, updated);
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
    const existing = this.bindingsByKey.get(registryKey);
    if (existing !== undefined) {
      for (const removed of existing) {
        onReplaced(removed);
      }
    }
    this.bindingsByKey.set(registryKey, [nextBinding]);
  }
}
