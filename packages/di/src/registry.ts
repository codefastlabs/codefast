import type { Binding } from "#/binding";
import { bindingSlotEquals, bindingSlotToString } from "#/binding";
import type { Token } from "#/token";
import type { BindingIdentifier, Constructor, DependencyKey } from "#/types";

// Superset of every binding kind's fields, used to normalize hidden classes below.
type BindingFieldSuperset = Binding & {
  readonly scope?: unknown;
  readonly target?: unknown;
  readonly factory?: unknown;
  readonly deps?: unknown;
  readonly value?: unknown;
  readonly onActivation?: unknown;
  readonly onDeactivation?: unknown;
};

/**
 * Rebuilds a binding with every kind's fields in one fixed key order, so all stored
 * bindings share a single V8 hidden class. Mixed binding kinds otherwise turn the
 * resolver's hot property reads (kind/scope/factory/...) megamorphic, which costs
 * ~30% throughput in processes that exercise many kinds. The value-erasing cast is
 * safe: every declared field is copied verbatim and `kind` stays the discriminant.
 */
function normalizeBindingShape(binding: Binding): Binding {
  const source = binding as BindingFieldSuperset;
  return {
    kind: source.kind,
    id: source.id,
    token: source.token,
    slot: source.slot,
    predicate: source.predicate,
    scope: source.scope,
    target: source.target,
    factory: source.factory,
    deps: source.deps,
    value: source.value,
    onActivation: source.onActivation,
    onDeactivation: source.onDeactivation,
  } as Binding;
}

/**
 * @since 0.3.16-canary.0
 */
export class BindingRegistry {
  // Monotonic mutation counter — lets resolvers version-stamp lookup caches across a container chain.
  #version = 0;
  // Map from token key -> array of bindings (order matters for last-wins)
  readonly #bindings = new Map<DependencyKey, Array<Binding>>();
  // Fast lookup by binding ID
  readonly #byId = new Map<BindingIdentifier, Binding>();
  // Fast lookup for slot { name, tags: [] }
  readonly #simpleNamed = new Map<DependencyKey, Map<string, Binding>>();
  // Fast path for one default slot binding with no predicate
  readonly #fastDefault = new Map<DependencyKey, Binding>();
  // Fast lookup for slot { name: undefined, tags: [[key, value]] } with no predicate
  readonly #simpleTagged = new Map<DependencyKey, Map<string, Map<unknown, Binding>>>();

  /** Monotonic version — increments on every mutation. */
  get version(): number {
    return this.#version;
  }

  /** Add or replace binding using slot-aware last-wins. Returns the displaced binding, if any. */
  add(uncommittedBinding: Binding): Binding | undefined {
    this.#version += 1;
    const binding = normalizeBindingShape(uncommittedBinding);
    const key = binding.token as DependencyKey;
    // ✓ TS6.0: Map.getOrInsert (ES2025) replaces the manual get+check+set upsert
    const bindingsForToken = this.#bindings.getOrInsert(key, []);

    // Only apply last-wins for slot-based bindings (not predicate-only)
    let displacedBinding: Binding | undefined;
    if (!this.#isPurePredicateBinding(binding)) {
      const existingIndex = bindingsForToken.findIndex(
        (candidate) => !this.#isPurePredicateBinding(candidate) && bindingSlotEquals(candidate.slot, binding.slot),
      );
      if (existingIndex !== -1) {
        displacedBinding = bindingsForToken[existingIndex]!;
        this.#byId.delete(displacedBinding.id);
        bindingsForToken.splice(existingIndex, 1);
        this.#deindexSimpleNamedBinding(key, displacedBinding);
        this.#deindexSimpleTaggedBinding(key, displacedBinding);
      }
    }

    bindingsForToken.push(binding);
    this.#byId.set(binding.id, binding);
    this.#indexSimpleNamedBinding(key, binding);
    this.#indexSimpleTaggedBinding(key, binding);
    this.#refreshFastDefaultForToken(key);
    return displacedBinding;
  }

  /** Remove all bindings for a token. Returns removed bindings. */
  removeByToken(token: Token<unknown> | Constructor): Array<Binding> {
    this.#version += 1;
    const key = token as DependencyKey;
    const bindingsForToken = this.#bindings.get(key) ?? [];
    this.#bindings.delete(key);
    this.#simpleNamed.delete(key);
    this.#simpleTagged.delete(key);
    this.#fastDefault.delete(key);
    for (const binding of bindingsForToken) {
      this.#byId.delete(binding.id);
    }
    return bindingsForToken;
  }

  /** Remove a specific binding by ID. Returns the removed binding or undefined. */
  removeById(id: BindingIdentifier): Binding | undefined {
    const binding = this.#byId.get(id);
    if (binding === undefined) {
      return undefined;
    }
    this.#version += 1;
    this.#byId.delete(id);
    const key = binding.token as DependencyKey;
    const bindingsForToken = this.#bindings.get(key);
    if (bindingsForToken !== undefined) {
      const bindingIndex = bindingsForToken.findIndex((candidate) => candidate.id === id);
      if (bindingIndex !== -1) {
        bindingsForToken.splice(bindingIndex, 1);
      }
      this.#deindexSimpleNamedBinding(key, binding);
      this.#deindexSimpleTaggedBinding(key, binding);
      if (bindingsForToken.length === 0) {
        this.#bindings.delete(key);
        this.#simpleNamed.delete(key);
        this.#simpleTagged.delete(key);
        this.#fastDefault.delete(key);
      } else {
        this.#refreshFastDefaultForToken(key);
      }
    }
    return binding;
  }

  /** Get all bindings for a token. */
  getAll(token: Token<unknown> | Constructor): ReadonlyArray<Binding> {
    return this.#bindings.get(token as DependencyKey) ?? [];
  }

  /** Get binding by ID. */
  getById(id: BindingIdentifier): Binding | undefined {
    return this.#byId.get(id);
  }

  /** Check if any binding exists for token. */
  has(token: Token<unknown> | Constructor): boolean {
    const key = token as DependencyKey;
    const list = this.#bindings.get(key);
    return list !== undefined && list.length > 0;
  }

  /** All bindings in the registry. */
  allBindings(): ReadonlyArray<Binding> {
    const allBindings: Array<Binding> = [];
    for (const bindingsForToken of this.#bindings.values()) {
      allBindings.push(...bindingsForToken);
    }
    return allBindings;
  }

  /** Remove all bindings. Returns all removed. */
  clear(): ReadonlyArray<Binding> {
    this.#version += 1;
    const all = this.allBindings();
    this.#bindings.clear();
    this.#byId.clear();
    this.#simpleNamed.clear();
    this.#simpleTagged.clear();
    this.#fastDefault.clear();
    return all;
  }

  getSimpleNamed(token: Token<unknown> | Constructor, name: string): Binding | undefined {
    return this.#simpleNamed.get(token as DependencyKey)?.get(name);
  }

  getSimpleTagged(token: Token<unknown> | Constructor, tagKey: string, tagValue: unknown): Binding | undefined {
    return this.#simpleTagged
      .get(token as DependencyKey)
      ?.get(tagKey)
      ?.get(tagValue);
  }

  getFastDefault(token: Token<unknown> | Constructor): Binding | undefined {
    return this.#fastDefault.get(token as DependencyKey);
  }

  /** Summarize available slot strings for a token (for error messages). */
  availableSlotStrings(token: Token<unknown> | Constructor): Array<string> {
    const bindingsForToken = this.#bindings.get(token as DependencyKey) ?? [];
    return bindingsForToken.map((binding) => bindingSlotToString(binding.slot));
  }

  #indexSimpleTaggedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name !== undefined || slot.tags.length !== 1 || binding.predicate !== undefined) {
      return;
    }
    const [tagKey, tagValue] = slot.tags[0]!;
    const byTagKey = this.#simpleTagged.getOrInsert(tokenKey, new Map<string, Map<unknown, Binding>>());
    const byTagValue = byTagKey.getOrInsert(tagKey, new Map<unknown, Binding>());
    byTagValue.set(tagValue, binding);
  }

  #deindexSimpleTaggedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name !== undefined || slot.tags.length !== 1 || binding.predicate !== undefined) {
      return;
    }
    const [tagKey, tagValue] = slot.tags[0]!;
    const byTagKey = this.#simpleTagged.get(tokenKey);
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
          this.#simpleTagged.delete(tokenKey);
        }
      }
    }
  }

  #isPurePredicateBinding(binding: Binding): boolean {
    const slot = binding.slot;
    const hasPredicate = binding.predicate !== undefined;
    const hasConstraint = slot.name !== undefined || slot.tags.length > 0;
    // Pure predicate = has predicate but no slot constraint (name/tags)
    return hasPredicate && !hasConstraint;
  }

  #indexSimpleNamedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name === undefined || slot.tags.length > 0) {
      return;
    }
    const bindingsByName = this.#simpleNamed.getOrInsert(tokenKey, new Map<string, Binding>());
    bindingsByName.set(slot.name, binding);
  }

  #deindexSimpleNamedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const slot = binding.slot;
    if (slot.name === undefined || slot.tags.length > 0) {
      return;
    }
    const bindingsByName = this.#simpleNamed.get(tokenKey);
    if (bindingsByName === undefined) {
      return;
    }
    const currentBinding = bindingsByName.get(slot.name);
    if (currentBinding?.id === binding.id) {
      bindingsByName.delete(slot.name);
      if (bindingsByName.size === 0) {
        this.#simpleNamed.delete(tokenKey);
      }
    }
  }

  #refreshFastDefaultForToken(tokenKey: DependencyKey): void {
    const bindingsForToken = this.#bindings.get(tokenKey);
    if (bindingsForToken === undefined || bindingsForToken.length !== 1) {
      this.#fastDefault.delete(tokenKey);
      return;
    }
    const onlyBinding = bindingsForToken[0]!;
    const isDefaultSlot = onlyBinding.slot.name === undefined && onlyBinding.slot.tags.length === 0;
    if (!isDefaultSlot || onlyBinding.predicate !== undefined) {
      this.#fastDefault.delete(tokenKey);
      return;
    }
    this.#fastDefault.set(tokenKey, onlyBinding);
  }
}
