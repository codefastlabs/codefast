import type { Binding } from "#/binding";
import type { BindingIdentifier, Constructor, DependencyKey } from "#/types";
import type { Token } from "#/token";
import { bindingSlotEquals, bindingSlotToString } from "#/binding";

/**
 * @since 0.3.16-canary.0
 */
export class BindingRegistry {
  // Map from token key -> array of bindings (order matters for last-wins)
  private readonly _bindings = new Map<DependencyKey, Array<Binding>>();
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
    let bindingsForToken = this._bindings.get(key);
    if (bindingsForToken === undefined) {
      bindingsForToken = [];
      this._bindings.set(key, bindingsForToken);
    }

    // Only apply last-wins for slot-based bindings (not predicate-only)
    if (!this._isPurePredicateBinding(binding)) {
      const existingIndex = bindingsForToken.findIndex(
        (candidate) =>
          !this._isPurePredicateBinding(candidate) &&
          bindingSlotEquals(candidate.slot, binding.slot),
      );
      if (existingIndex !== -1) {
        const replacedBinding = bindingsForToken[existingIndex]!;
        this._byId.delete(replacedBinding.id);
        bindingsForToken.splice(existingIndex, 1);
      }
    }

    bindingsForToken.push(binding);
    this._byId.set(binding.id, binding);
    this._indexSimpleNamedBinding(key, binding);
    this._indexSimpleTaggedBinding(key, binding);
    this._refreshFastDefaultForToken(key);
  }

  /** Remove all bindings for a token. Returns removed bindings. */
  removeByToken(token: Token<unknown> | Constructor): Array<Binding> {
    const key = token as DependencyKey;
    const bindingsForToken = this._bindings.get(key) ?? [];
    this._bindings.delete(key);
    this._simpleNamed.delete(key);
    this._simpleTagged.delete(key);
    this._fastDefault.delete(key);
    for (const binding of bindingsForToken) {
      this._byId.delete(binding.id);
    }
    return bindingsForToken;
  }

  /** Remove a specific binding by ID. Returns the removed binding or undefined. */
  removeById(id: BindingIdentifier): Binding | undefined {
    const binding = this._byId.get(id);
    if (binding === undefined) {
      return undefined;
    }
    this._byId.delete(id);
    const key = binding.token as DependencyKey;
    const bindingsForToken = this._bindings.get(key);
    if (bindingsForToken !== undefined) {
      const bindingIndex = bindingsForToken.findIndex((candidate) => candidate.id === id);
      if (bindingIndex !== -1) {
        bindingsForToken.splice(bindingIndex, 1);
      }
      this._deindexSimpleNamedBinding(key, binding);
      this._deindexSimpleTaggedBinding(key, binding);
      if (bindingsForToken.length === 0) {
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
  getAll(token: Token<unknown> | Constructor): ReadonlyArray<Binding> {
    return this._bindings.get(token as DependencyKey) ?? [];
  }

  /** Get binding by ID. */
  getById(id: BindingIdentifier): Binding | undefined {
    return this._byId.get(id);
  }

  /** Check if any binding exists for token. */
  has(token: Token<unknown> | Constructor): boolean {
    const key = token as DependencyKey;
    const list = this._bindings.get(key);
    return list !== undefined && list.length > 0;
  }

  /** All bindings in the registry. */
  allBindings(): ReadonlyArray<Binding> {
    const allBindings: Array<Binding> = [];
    for (const bindingsForToken of this._bindings.values()) {
      allBindings.push(...bindingsForToken);
    }
    return allBindings;
  }

  /** Remove all bindings. Returns all removed. */
  clear(): ReadonlyArray<Binding> {
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
  availableSlotStrings(token: Token<unknown> | Constructor): Array<string> {
    const bindingsForToken = this._bindings.get(token as DependencyKey) ?? [];
    return bindingsForToken.map((binding) => bindingSlotToString(binding.slot));
  }

  private _indexSimpleTaggedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name !== undefined || slot.tags.length !== 1 || binding.predicate !== undefined) {
      return;
    }
    const [tagKey, tagValue] = slot.tags[0]!;
    let byTagKey = this._simpleTagged.get(tokenKey);
    if (byTagKey === undefined) {
      byTagKey = new Map<string, Map<unknown, Binding>>();
      this._simpleTagged.set(tokenKey, byTagKey);
    }
    let byTagValue = byTagKey.get(tagKey);
    if (byTagValue === undefined) {
      byTagValue = new Map<unknown, Binding>();
      byTagKey.set(tagKey, byTagValue);
    }
    byTagValue.set(tagValue, binding);
  }

  private _deindexSimpleTaggedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name !== undefined || slot.tags.length !== 1 || binding.predicate !== undefined) {
      return;
    }
    const [tagKey, tagValue] = slot.tags[0]!;
    const byTagKey = this._simpleTagged.get(tokenKey);
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
          this._simpleTagged.delete(tokenKey);
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

  private _indexSimpleNamedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name === undefined || slot.tags.length > 0) {
      return;
    }
    let bindingsByName = this._simpleNamed.get(tokenKey);
    if (bindingsByName === undefined) {
      bindingsByName = new Map<string, Binding>();
      this._simpleNamed.set(tokenKey, bindingsByName);
    }
    bindingsByName.set(slot.name, binding);
  }

  private _deindexSimpleNamedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name === undefined || slot.tags.length > 0) {
      return;
    }
    const bindingsByName = this._simpleNamed.get(tokenKey);
    if (bindingsByName === undefined) {
      return;
    }
    const currentBinding = bindingsByName.get(slot.name);
    if (currentBinding?.id === binding.id) {
      bindingsByName.delete(slot.name);
      if (bindingsByName.size === 0) {
        this._simpleNamed.delete(tokenKey);
      }
    }
  }

  private _refreshFastDefaultForToken(tokenKey: DependencyKey): void {
    const bindingsForToken = this._bindings.get(tokenKey);
    if (bindingsForToken === undefined || bindingsForToken.length !== 1) {
      this._fastDefault.delete(tokenKey);
      return;
    }
    const onlyBinding = bindingsForToken[0]!;
    const isDefaultSlot = onlyBinding.slot.name === undefined && onlyBinding.slot.tags.length === 0;
    if (!isDefaultSlot || onlyBinding.predicate !== undefined) {
      this._fastDefault.delete(tokenKey);
      return;
    }
    this._fastDefault.set(tokenKey, onlyBinding);
  }
}
