import type { Binding } from "#/core/binding";
import { bindingSlotEquals, bindingSlotToString } from "#/core/binding";
import { getOrInsert } from "#/core/map-upsert";
import type { BindingTag } from "#/core/tag";
import type { Token } from "#/core/token";
import type { BindingIdentifier, Constructor, DependencyKey } from "#/core/types";

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
  // Fast lookup for slot { name, tags: [] } — unallocated until a named binding is registered.
  #simpleNamed: Map<DependencyKey, Map<string, Binding>> | undefined;
  // Fast path for one default slot binding with no predicate
  readonly #fastDefault = new Map<DependencyKey, Binding>();
  // Fast lookup for a slot carrying exactly one tag — keyed by the interned criterion itself, so
  // the (key, value) pair is one hash rather than two. Unallocated until a tagged binding lands.
  #simpleTagged: Map<DependencyKey, Map<BindingTag, Binding>> | undefined;
  // Name-less slots with two or more tags, bucketed by their FIRST criterion. A matching slot's
  // every tag is in the request, so walking the request's buckets finds each candidate exactly once.
  #multiTagged: Map<DependencyKey, Map<BindingTag, Array<Binding>>> | undefined;

  // Set on the first constant registered and never cleared. Teardown only needs the negative answer
  // to be exact, and that is what lets a container holding no constant skip its sweep entirely.
  #heldConstantBinding = false;

  /** Monotonic version — increments on every mutation. */
  get version(): number {
    return this.#version;
  }

  /** Whether a constant has ever been registered here, and so whether teardown has anything to sweep. */
  get hasHeldConstantBinding(): boolean {
    return this.#heldConstantBinding;
  }

  /**
   * Registers a mutation the indexes don't care about (a fluent chain refining scope or an
   * activation hook in place), so version-stamped resolver caches still invalidate.
   */
  touch(): void {
    this.#version += 1;
  }

  /**
   * Adds or replaces a binding using slot-aware last-wins. Returns the displaced binding, if any.
   *
   * @remarks The binding is stored by reference — it must come from `createBinding`, which is
   * what guarantees the single hidden class the resolver's hot reads depend on.
   */
  add(binding: Binding): Binding | undefined {
    this.#version += 1;
    if (binding.kind === "constant") {
      this.#heldConstantBinding = true;
    }
    const key: DependencyKey = binding.token;
    // Copy-on-write: a selection may be walking the current list inside a `when()` predicate, so
    // mutation replaces the array and never splices one that has been handed out.
    const bindingsForToken = this.#bindings.get(key);

    // Only apply last-wins for slot-based bindings (not predicate-only)
    let displacedBinding: Binding | undefined;
    let nextBindings: Array<Binding>;
    if (bindingsForToken === undefined) {
      nextBindings = [binding];
    } else {
      if (!isPurePredicateBinding(binding)) {
        const existingIndex = bindingsForToken.findIndex(
          (candidate) => !isPurePredicateBinding(candidate) && bindingSlotEquals(candidate.slot, binding.slot),
        );
        if (existingIndex !== -1) {
          displacedBinding = bindingsForToken[existingIndex]!;
          this.#byId.delete(displacedBinding.id);
          this.#deindexSimpleNamedBinding(key, displacedBinding);
          this.#deindexSimpleTaggedBinding(key, displacedBinding);
          this.#deindexMultiTaggedBinding(key, displacedBinding);
        }
      }
      nextBindings =
        displacedBinding === undefined
          ? [...bindingsForToken, binding]
          : [...bindingsForToken.filter((candidate) => candidate !== displacedBinding), binding];
    }

    this.#bindings.set(key, nextBindings);
    this.#byId.set(binding.id, binding);
    this.#indexSimpleNamedBinding(key, binding);
    this.#indexSimpleTaggedBinding(key, binding);
    this.#indexMultiTaggedBinding(key, binding);
    this.#refreshFastDefaultForToken(key);
    return displacedBinding;
  }

  /** Remove all bindings for a token. Returns removed bindings. */
  removeByToken(token: Token<unknown> | Constructor): Array<Binding> {
    this.#version += 1;
    const key: DependencyKey = token;
    const bindingsForToken = this.#bindings.get(key) ?? [];
    this.#bindings.delete(key);
    this.#simpleNamed?.delete(key);
    this.#simpleTagged?.delete(key);
    this.#multiTagged?.delete(key);
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
    const key: DependencyKey = binding.token;
    const bindingsForToken = this.#bindings.get(key);
    if (bindingsForToken !== undefined) {
      const bindingIndex = bindingsForToken.findIndex((candidate) => candidate.id === id);
      // Copy-on-write, like `add`: a walk holding the current array must not lose its place.
      const remaining = bindingIndex === -1 ? bindingsForToken : bindingsForToken.toSpliced(bindingIndex, 1);
      this.#deindexSimpleNamedBinding(key, binding);
      this.#deindexSimpleTaggedBinding(key, binding);
      this.#deindexMultiTaggedBinding(key, binding);
      if (remaining.length === 0) {
        this.#bindings.delete(key);
        this.#simpleNamed?.delete(key);
        this.#simpleTagged?.delete(key);
        this.#multiTagged?.delete(key);
        this.#fastDefault.delete(key);
      } else {
        this.#bindings.set(key, remaining);
        this.#refreshFastDefaultForToken(key);
      }
    }
    return binding;
  }

  /** Get all bindings for a token. */
  getAll(token: Token<unknown> | Constructor): ReadonlyArray<Binding> {
    return this.#bindings.get(token) ?? [];
  }

  /** Get binding by ID. */
  getById(id: BindingIdentifier): Binding | undefined {
    return this.#byId.get(id);
  }

  /** Check if any binding exists for token. */
  has(token: Token<unknown> | Constructor): boolean {
    const key: DependencyKey = token;
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
    this.#simpleNamed?.clear();
    this.#simpleTagged?.clear();
    this.#multiTagged?.clear();
    this.#fastDefault.clear();
    return all;
  }

  /** Whether a slot-based binding currently occupies `binding`'s slot, so adding it would displace. */
  hasSlotOccupant(binding: Binding): boolean {
    if (isPurePredicateBinding(binding)) {
      return false;
    }
    const candidates = this.#bindings.get(binding.token);
    if (candidates === undefined) {
      return false;
    }
    return candidates.some(
      (candidate) => !isPurePredicateBinding(candidate) && bindingSlotEquals(candidate.slot, binding.slot),
    );
  }

  getSimpleNamed(token: Token<unknown> | Constructor, name: string): Binding | undefined {
    return this.#simpleNamed?.get(token)?.get(name);
  }

  /**
   * The binding indexed under one criterion.
   *
   * @remarks Exact, with no re-check: criteria are interned, so a `Map` keyed by the pair answers by
   * identity — where a value-keyed map answered by SameValueZero and parted from `Object.is` on ±0.
   */
  getSimpleTagged(token: Token<unknown> | Constructor, criterion: BindingTag): Binding | undefined {
    return this.#simpleTagged?.get(token)?.get(criterion);
  }

  /**
   * The multi-tag bindings whose slot's first criterion is `criterion`.
   *
   * @remarks A prefilter, not an answer: a bucket member's remaining tags still have to be matched
   * against the request — first-criterion bucketing only guarantees each candidate appears once.
   */
  getMultiTagged(token: Token<unknown> | Constructor, criterion: BindingTag): ReadonlyArray<Binding> | undefined {
    return this.#multiTagged?.get(token)?.get(criterion);
  }

  getFastDefault(token: Token<unknown> | Constructor): Binding | undefined {
    return this.#fastDefault.get(token);
  }

  /** Summarize available slot strings for a token (for error messages). */
  availableSlotStrings(token: Token<unknown> | Constructor): Array<string> {
    const bindingsForToken = this.#bindings.get(token) ?? [];
    return bindingsForToken.map((binding) => bindingSlotToString(binding.slot));
  }

  #indexSimpleTaggedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const criterion = simpleTagOf(binding);
    if (criterion === undefined) {
      return;
    }
    this.#simpleTagged ??= new Map();
    const byCriterion = getOrInsert(this.#simpleTagged, tokenKey, new Map<BindingTag, Binding>());
    byCriterion.set(criterion, binding);
  }

  #deindexSimpleTaggedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const criterion = simpleTagOf(binding);
    if (criterion === undefined) {
      return;
    }
    const byCriterion = this.#simpleTagged?.get(tokenKey);
    if (byCriterion === undefined) {
      return;
    }
    if (byCriterion.get(criterion)?.id === binding.id) {
      byCriterion.delete(criterion);
      if (byCriterion.size === 0) {
        this.#simpleTagged!.delete(tokenKey);
      }
    }
  }

  #indexMultiTaggedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const firstCriterion = multiTagFirstOf(binding);
    if (firstCriterion === undefined) {
      return;
    }
    this.#multiTagged ??= new Map();
    const buckets = getOrInsert(this.#multiTagged, tokenKey, new Map<BindingTag, Array<Binding>>());
    getOrInsert(buckets, firstCriterion, []).push(binding);
  }

  #deindexMultiTaggedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const firstCriterion = multiTagFirstOf(binding);
    if (firstCriterion === undefined) {
      return;
    }
    const bucket = this.#multiTagged?.get(tokenKey)?.get(firstCriterion);
    if (bucket === undefined) {
      return;
    }
    const bindingIndex = bucket.findIndex((candidate) => candidate.id === binding.id);
    // Spliced in place: nothing walks a bucket while user code runs — candidates are gathered
    // into their own array before any predicate is evaluated.
    if (bindingIndex !== -1) {
      bucket.splice(bindingIndex, 1);
    }
  }

  #indexSimpleNamedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const name = simpleNameOf(binding);
    if (name === undefined) {
      return;
    }
    this.#simpleNamed ??= new Map();
    const bindingsByName = getOrInsert(this.#simpleNamed, tokenKey, new Map<string, Binding>());
    bindingsByName.set(name, binding);
  }

  #deindexSimpleNamedBinding(tokenKey: DependencyKey, binding: Binding): void {
    const name = simpleNameOf(binding);
    if (name === undefined) {
      return;
    }
    const bindingsByName = this.#simpleNamed?.get(tokenKey);
    if (bindingsByName === undefined) {
      return;
    }
    if (bindingsByName.get(name)?.id === binding.id) {
      bindingsByName.delete(name);
      if (bindingsByName.size === 0) {
        this.#simpleNamed!.delete(tokenKey);
      }
    }
  }

  #refreshFastDefaultForToken(tokenKey: DependencyKey): void {
    const bindingsForToken = this.#bindings.get(tokenKey);
    const onlyBinding = bindingsForToken?.length === 1 ? bindingsForToken[0]! : undefined;
    if (onlyBinding !== undefined && isDefaultSlotBinding(onlyBinding)) {
      this.#fastDefault.set(tokenKey, onlyBinding);
      return;
    }
    this.#fastDefault.delete(tokenKey);
  }

  /** Whether the deferred named-slot index has had to be built. */
  get isNamedIndexBuilt(): boolean {
    return this.#simpleNamed !== undefined;
  }

  /** Whether the deferred tagged-slot index has had to be built. */
  get isTaggedIndexBuilt(): boolean {
    return this.#simpleTagged !== undefined;
  }
}

/** The name a binding is indexed under, or `undefined` when its slot is more than a plain name. */
function simpleNameOf(binding: Binding): string | undefined {
  const { name, tags } = binding.slot;
  return name !== undefined && tags.length === 0 ? name : undefined;
}

/**
 * The tag a binding is indexed under, or `undefined` when its slot is more than one plain tag.
 *
 * @remarks Carries predicate-bearing bindings too, exactly as the name index does: every lane that
 * reads this index already re-checks what it finds, so an indexed hit was never unconditional.
 */
function simpleTagOf(binding: Binding): BindingTag | undefined {
  const { name, tags } = binding.slot;
  return name === undefined && tags.length === 1 ? tags[0] : undefined;
}

/** The first criterion a multi-tag slot is bucketed under, or `undefined` for any other shape. */
function multiTagFirstOf(binding: Binding): BindingTag | undefined {
  const { name, tags } = binding.slot;
  return name === undefined && tags.length >= 2 ? tags[0] : undefined;
}

/** A binding nothing has to be matched against: the default slot, no predicate. */
function isDefaultSlotBinding(binding: Binding): boolean {
  const { name, tags } = binding.slot;
  return name === undefined && tags.length === 0 && binding.predicate === undefined;
}

/** A predicate with no slot constraint: last-wins does not apply to it. */
function isPurePredicateBinding(binding: Binding): boolean {
  const { name, tags } = binding.slot;
  return binding.predicate !== undefined && name === undefined && tags.length === 0;
}
