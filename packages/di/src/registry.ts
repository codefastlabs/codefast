import type { Binding } from "#/binding";
import type { BindingIdentifier, Constructor, DependencyKey } from "#/types";
import type { Token } from "#/token";
import { slotKeyEquals } from "#/binding";

/**
 * @since 0.3.16-canary.0
 */
export class BindingRegistry {
  // Map from token key -> array of bindings (order matters for last-wins)
  private readonly _bindings = new Map<DependencyKey, Binding[]>();
  // Fast lookup by binding ID
  private readonly _byId = new Map<BindingIdentifier, Binding>();
  // Fast lookup for slot { name, tags: [] }
  private readonly _simpleNamed = new Map<DependencyKey, Map<string, Binding>>();
  // Fast path for one default slot binding with no predicate
  private readonly _fastDefault = new Map<DependencyKey, Binding>();
  // Fast lookup for slot { name: undefined, tags: [[key, value]] } with no predicate
  private readonly _simpleTagged = new Map<DependencyKey, Map<string, Map<unknown, Binding>>>();

  /** Add or replace binding using slot-aware last-wins. */
  add(binding: Binding): void {
    const key = binding.token as DependencyKey;
    let list = this._bindings.get(key);
    if (list === undefined) {
      list = [];
      this._bindings.set(key, list);
    }

    // Only apply last-wins for slot-based bindings (not predicate-only)
    if (!this._isPurePredicateBinding(binding)) {
      const existingIndex = list.findIndex(
        (b) => !this._isPurePredicateBinding(b) && slotKeyEquals(b.slot, binding.slot),
      );
      if (existingIndex !== -1) {
        const old = list[existingIndex]!;
        this._byId.delete(old.id);
        list.splice(existingIndex, 1);
      }
    }

    list.push(binding);
    this._byId.set(binding.id, binding);
    this._indexSimpleNamedBinding(key, binding);
    this._indexSimpleTaggedBinding(key, binding);
    this._refreshFastDefaultForToken(key);
  }

  /** Remove all bindings for a token. Returns removed bindings. */
  removeByToken(t: Token<unknown> | Constructor): Binding[] {
    const key = t as DependencyKey;
    const list = this._bindings.get(key) ?? [];
    this._bindings.delete(key);
    this._simpleNamed.delete(key);
    this._simpleTagged.delete(key);
    this._fastDefault.delete(key);
    for (const b of list) {
      this._byId.delete(b.id);
    }
    return list;
  }

  /** Remove a specific binding by ID. Returns the removed binding or undefined. */
  removeById(id: BindingIdentifier): Binding | undefined {
    const binding = this._byId.get(id);
    if (binding === undefined) {
      return undefined;
    }
    this._byId.delete(id);
    const key = binding.token as DependencyKey;
    const list = this._bindings.get(key);
    if (list !== undefined) {
      const idx = list.findIndex((b) => b.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
      this._deindexSimpleNamedBinding(key, binding);
      this._deindexSimpleTaggedBinding(key, binding);
      if (list.length === 0) {
        this._bindings.delete(key);
        this._simpleNamed.delete(key);
        this._simpleTagged.delete(key);
        this._fastDefault.delete(key);
      } else {
        this._refreshFastDefaultForToken(key);
      }
    }
    return binding;
  }

  /** Get all bindings for a token. */
  getAll(t: Token<unknown> | Constructor): readonly Binding[] {
    return this._bindings.get(t as DependencyKey) ?? [];
  }

  /** Get binding by ID. */
  getById(id: BindingIdentifier): Binding | undefined {
    return this._byId.get(id);
  }

  /** Check if any binding exists for token. */
  has(t: Token<unknown> | Constructor): boolean {
    const key = t as DependencyKey;
    const list = this._bindings.get(key);
    return list !== undefined && list.length > 0;
  }

  /** All bindings in the registry. */
  allBindings(): readonly Binding[] {
    const result: Binding[] = [];
    for (const list of this._bindings.values()) {
      result.push(...list);
    }
    return result;
  }

  /** Remove all bindings. Returns all removed. */
  clear(): readonly Binding[] {
    const all = this.allBindings();
    this._bindings.clear();
    this._byId.clear();
    this._simpleNamed.clear();
    this._simpleTagged.clear();
    this._fastDefault.clear();
    return all;
  }

  getSimpleNamed(token: Token<unknown> | Constructor, name: string): Binding | undefined {
    return this._simpleNamed.get(token as DependencyKey)?.get(name);
  }

  getSimpleTagged(
    token: Token<unknown> | Constructor,
    tagKey: string,
    tagValue: unknown,
  ): Binding | undefined {
    return this._simpleTagged
      .get(token as DependencyKey)
      ?.get(tagKey)
      ?.get(tagValue);
  }

  getFastDefault(token: Token<unknown> | Constructor): Binding | undefined {
    return this._fastDefault.get(token as DependencyKey);
  }

  /** Summarize available slot strings for a token (for error messages). */
  availableSlotStrings(t: Token<unknown> | Constructor): string[] {
    const list = this._bindings.get(t as DependencyKey) ?? [];
    return list.map((b) => {
      const s = b.slot;
      if (s.name === undefined && s.tags.length === 0) {
        return "default";
      }
      const parts: string[] = [];
      if (s.name !== undefined) {
        parts.push(`name:${s.name}`);
      }
      for (const [k, v] of s.tags) {
        parts.push(`tag:${k}=${String(v)}`);
      }
      return parts.join(",");
    });
  }

  private _indexSimpleTaggedBinding(tokenKeyValue: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name !== undefined || slot.tags.length !== 1 || binding.predicate !== undefined) {
      return;
    }
    const [tagKey, tagValue] = slot.tags[0]!;
    let byTagKey = this._simpleTagged.get(tokenKeyValue);
    if (byTagKey === undefined) {
      byTagKey = new Map<string, Map<unknown, Binding>>();
      this._simpleTagged.set(tokenKeyValue, byTagKey);
    }
    let byTagValue = byTagKey.get(tagKey);
    if (byTagValue === undefined) {
      byTagValue = new Map<unknown, Binding>();
      byTagKey.set(tagKey, byTagValue);
    }
    byTagValue.set(tagValue, binding);
  }

  private _deindexSimpleTaggedBinding(tokenKeyValue: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name !== undefined || slot.tags.length !== 1 || binding.predicate !== undefined) {
      return;
    }
    const [tagKey, tagValue] = slot.tags[0]!;
    const byTagKey = this._simpleTagged.get(tokenKeyValue);
    if (byTagKey === undefined) {
      return;
    }
    const byTagValue = byTagKey.get(tagKey);
    if (byTagValue === undefined) {
      return;
    }
    const current = byTagValue.get(tagValue);
    if (current?.id === binding.id) {
      byTagValue.delete(tagValue);
      if (byTagValue.size === 0) {
        byTagKey.delete(tagKey);
        if (byTagKey.size === 0) {
          this._simpleTagged.delete(tokenKeyValue);
        }
      }
    }
  }

  private _isPurePredicateBinding(binding: Binding): boolean {
    const slot = binding.slot;
    const hasPredicate = binding.predicate !== undefined;
    const hasConstraint = slot.name !== undefined || slot.tags.length > 0;
    // Pure predicate = has predicate but no slot constraint (name/tags)
    return hasPredicate && !hasConstraint;
  }

  private _indexSimpleNamedBinding(tokenKeyValue: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name === undefined || slot.tags.length > 0) {
      return;
    }
    let byName = this._simpleNamed.get(tokenKeyValue);
    if (byName === undefined) {
      byName = new Map<string, Binding>();
      this._simpleNamed.set(tokenKeyValue, byName);
    }
    byName.set(slot.name, binding);
  }

  private _deindexSimpleNamedBinding(tokenKeyValue: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name === undefined || slot.tags.length > 0) {
      return;
    }
    const byName = this._simpleNamed.get(tokenKeyValue);
    if (byName === undefined) {
      return;
    }
    const current = byName.get(slot.name);
    if (current?.id === binding.id) {
      byName.delete(slot.name);
      if (byName.size === 0) {
        this._simpleNamed.delete(tokenKeyValue);
      }
    }
  }

  private _refreshFastDefaultForToken(tokenKeyValue: DependencyKey): void {
    const list = this._bindings.get(tokenKeyValue);
    if (list === undefined || list.length !== 1) {
      this._fastDefault.delete(tokenKeyValue);
      return;
    }
    const onlyBinding = list[0]!;
    const isDefaultSlot = onlyBinding.slot.name === undefined && onlyBinding.slot.tags.length === 0;
    if (!isDefaultSlot || onlyBinding.predicate !== undefined) {
      this._fastDefault.delete(tokenKeyValue);
      return;
    }
    this._fastDefault.set(tokenKeyValue, onlyBinding);
  }
}
