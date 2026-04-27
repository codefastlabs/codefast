import type { Binding } from "#/binding";
import type { Constructor } from "#/types";
import type { Token } from "#/token";
import type { BindingIdentifier } from "#/types";
import { slotKeyEquals } from "#/binding";
type TokenKey = Token<unknown> | Constructor;

export class BindingRegistry {
  // Map from token key -> array of bindings (order matters for last-wins)
  private readonly _bindings = new Map<TokenKey, Binding[]>();
  // Fast lookup by binding ID
  private readonly _byId = new Map<BindingIdentifier, Binding>();
  // Fast lookup for slot { name, tags: [] }
  private readonly _simpleNamed = new Map<TokenKey, Map<string, Binding>>();
  // Fast path for one default slot binding with no predicate
  private readonly _fastDefault = new Map<TokenKey, Binding>();

  /** Add or replace binding using slot-aware last-wins. */
  add(binding: Binding): void {
    const key = binding.token as TokenKey;
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
    this._refreshFastDefaultForToken(key);
  }

  /** Remove all bindings for a token. Returns removed bindings. */
  removeByToken(t: Token<unknown> | Constructor): Binding[] {
    const key = t as TokenKey;
    const list = this._bindings.get(key) ?? [];
    this._bindings.delete(key);
    this._simpleNamed.delete(key);
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
    const key = binding.token as TokenKey;
    const list = this._bindings.get(key);
    if (list !== undefined) {
      const idx = list.findIndex((b) => b.id === id);
      if (idx !== -1) {
        list.splice(idx, 1);
      }
      this._deindexSimpleNamedBinding(key, binding);
      if (list.length === 0) {
        this._bindings.delete(key);
        this._simpleNamed.delete(key);
        this._fastDefault.delete(key);
      } else {
        this._refreshFastDefaultForToken(key);
      }
    }
    return binding;
  }

  /** Get all bindings for a token. */
  getAll(t: Token<unknown> | Constructor): readonly Binding[] {
    return this._bindings.get(t as TokenKey) ?? [];
  }

  /** Get binding by ID. */
  getById(id: BindingIdentifier): Binding | undefined {
    return this._byId.get(id);
  }

  /** Check if any binding exists for token. */
  has(t: Token<unknown> | Constructor): boolean {
    const key = t as TokenKey;
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
  clear(): Binding[] {
    const all = this.allBindings() as Binding[];
    this._bindings.clear();
    this._byId.clear();
    this._simpleNamed.clear();
    this._fastDefault.clear();
    return all;
  }

  getSimpleNamed(token: Token<unknown> | Constructor, name: string): Binding | undefined {
    return this._simpleNamed.get(token as TokenKey)?.get(name);
  }

  getFastDefault(token: Token<unknown> | Constructor): Binding | undefined {
    return this._fastDefault.get(token as TokenKey);
  }

  private _isPurePredicateBinding(binding: Binding): boolean {
    const slot = binding.slot;
    const hasPredicate = binding.predicate !== undefined;
    const hasConstraint = slot.name !== undefined || slot.tags.length > 0;
    // Pure predicate = has predicate but no slot constraint (name/tags)
    return hasPredicate && !hasConstraint;
  }

  /** Summarize available slot strings for a token (for error messages). */
  availableSlotStrings(t: Token<unknown> | Constructor): string[] {
    const list = this._bindings.get(t as TokenKey) ?? [];
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

  private _indexSimpleNamedBinding(tokenKeyValue: TokenKey, binding: Binding): void {
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

  private _deindexSimpleNamedBinding(tokenKeyValue: TokenKey, binding: Binding): void {
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

  private _refreshFastDefaultForToken(tokenKeyValue: TokenKey): void {
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
