import type { Binding } from "#/core/binding";
import { bindingSlotEquals, bindingSlotToString } from "#/core/binding";
import { getOrInsert } from "#/core/map-upsert";
import type { BindingTag } from "#/core/tag";
import type { Token } from "#/core/token";
import type { BindingIdentifier, Constructor, DependencyKey } from "#/core/types";

/**
 * Everything the registry knows about one token, in one record.
 *
 * @remarks One map lookup answers every question a resolve asks about a token — its list, its
 * default-slot fast path, its tagged indexes — and a bind into a fresh token is one record and one
 * map write. The indexes stay unallocated until a tagged slot lands on that token.
 */
interface TokenEntry {
  /** Registration order, copy-on-write: `add` and `removeById` replace it, never splice it. */
  bindings: ReadonlyArray<Binding>;
  /** Bindings whose slot carries exactly one criterion, keyed by that interned criterion. */
  simple: Map<BindingTag, Binding> | undefined;
  /** Bindings whose slot carries two or more criteria, bucketed by their first criterion. */
  multi: Map<BindingTag, Array<Binding>> | undefined;
}

const NO_BINDINGS: ReadonlyArray<Binding> = Object.freeze([]);

/** One construction site, so every entry shares a hidden class. */
function createTokenEntry(binding: Binding): TokenEntry {
  return {
    bindings: [binding],
    simple: undefined,
    multi: undefined,
  };
}

/**
 * One container's binding store, indexed by token, binding id, and slot for fast lookup.
 *
 * @since 0.3.16-canary.0
 */
export class BindingRegistry {
  // Monotonic mutation counter — lets resolvers version-stamp lookup caches across a container chain.
  #version = 0;
  // Allocated by the first bind, so a container that only resolves through its parent never pays
  // for the record map — only for the hot map below it.
  #entries: Map<DependencyKey, TokenEntry> | undefined;
  // The hot read on every resolve: a token's lone default-slot binding, one map probe away.
  readonly #fastDefault = new Map<DependencyKey, Binding>();
  // Built on the first id-keyed read and maintained from then on: a bind-and-resolve container
  // never asks by id, so it never pays for the second map.
  #byId: Map<BindingIdentifier, Binding> | undefined;
  // Set when the first tagged slot lands and never cleared, like the tagged maps it stands for.
  #taggedIndexBuilt = false;

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
    const entries = (this.#entries ??= new Map<DependencyKey, TokenEntry>());
    const entry = entries.get(key);
    if (entry === undefined) {
      const created = createTokenEntry(binding);
      entries.set(key, created);
      if (isDefaultSlotBinding(binding)) {
        this.#fastDefault.set(key, binding);
      }
      this.#byId?.set(binding.id, binding);
      if (binding.slot.tags.length > 0) {
        this.#indexTagged(created, binding);
      }
      return undefined;
    }

    // Only apply last-wins for slot-based bindings (not predicate-only)
    let displacedBinding: Binding | undefined;
    if (!isPurePredicateBinding(binding)) {
      displacedBinding = entry.bindings.find(
        (candidate) => !isPurePredicateBinding(candidate) && bindingSlotEquals(candidate.slot, binding.slot),
      );
      if (displacedBinding !== undefined) {
        this.#byId?.delete(displacedBinding.id);
        this.#deindexTagged(entry, displacedBinding);
      }
    }
    // Copy-on-write: a selection may be walking the current list inside a `when()` predicate, so
    // mutation replaces the array and never splices one that has been handed out.
    entry.bindings =
      displacedBinding === undefined
        ? [...entry.bindings, binding]
        : [...entry.bindings.filter((candidate) => candidate !== displacedBinding), binding];
    this.#byId?.set(binding.id, binding);
    if (binding.slot.tags.length > 0) {
      this.#indexTagged(entry, binding);
    }
    this.#refreshFastDefault(key, entry);
    return displacedBinding;
  }

  /** Remove all bindings for a token. Returns removed bindings. */
  removeByToken(token: Token<unknown> | Constructor): Array<Binding> {
    this.#version += 1;
    const entries = this.#entries;
    const entry = entries?.get(token);
    if (entries === undefined || entry === undefined) {
      return [];
    }
    entries.delete(token);
    this.#fastDefault.delete(token);
    if (this.#byId !== undefined) {
      for (const binding of entry.bindings) {
        this.#byId.delete(binding.id);
      }
    }
    return [...entry.bindings];
  }

  /** Remove a specific binding by ID. Returns the removed binding or undefined. */
  removeById(id: BindingIdentifier): Binding | undefined {
    const byId = this.#ensureById();
    const binding = byId.get(id);
    if (binding === undefined) {
      return undefined;
    }
    this.#version += 1;
    byId.delete(id);
    const key: DependencyKey = binding.token;
    const entries = this.#entries;
    const entry = entries?.get(key);
    if (entries !== undefined && entry !== undefined) {
      const bindingIndex = entry.bindings.findIndex((candidate) => candidate.id === id);
      // Copy-on-write, like `add`: a walk holding the current array must not lose its place.
      const remaining = bindingIndex === -1 ? entry.bindings : entry.bindings.toSpliced(bindingIndex, 1);
      this.#deindexTagged(entry, binding);
      if (remaining.length === 0) {
        entries.delete(key);
        this.#fastDefault.delete(key);
      } else {
        entry.bindings = remaining;
        this.#refreshFastDefault(key, entry);
      }
    }
    return binding;
  }

  /** Get all bindings for a token. */
  getAll(token: Token<unknown> | Constructor): ReadonlyArray<Binding> {
    return this.#entries?.get(token)?.bindings ?? NO_BINDINGS;
  }

  /** Get binding by ID. */
  getById(id: BindingIdentifier): Binding | undefined {
    return this.#ensureById().get(id);
  }

  /** Check if any binding exists for token. */
  has(token: Token<unknown> | Constructor): boolean {
    // An entry is dropped with its last binding, so presence is the whole answer.
    return this.#entries !== undefined && this.#entries.has(token);
  }

  /** All bindings in the registry. */
  allBindings(): ReadonlyArray<Binding> {
    if (this.#entries === undefined) {
      return NO_BINDINGS;
    }
    const allBindings: Array<Binding> = [];
    for (const entry of this.#entries.values()) {
      allBindings.push(...entry.bindings);
    }
    return allBindings;
  }

  /** Remove all bindings. Returns all removed. */
  clear(): ReadonlyArray<Binding> {
    this.#version += 1;
    const all = this.allBindings();
    this.#entries?.clear();
    this.#fastDefault.clear();
    this.#byId?.clear();
    return all;
  }

  /** Whether a slot-based binding currently occupies `binding`'s slot, so adding it would displace. */
  hasSlotOccupant(binding: Binding): boolean {
    if (isPurePredicateBinding(binding)) {
      return false;
    }
    const entry = this.#entries?.get(binding.token);
    if (entry === undefined) {
      return false;
    }
    return entry.bindings.some(
      (candidate) => !isPurePredicateBinding(candidate) && bindingSlotEquals(candidate.slot, binding.slot),
    );
  }

  /**
   * The binding indexed under one criterion.
   *
   * @remarks Exact, with no re-check: criteria are interned, so a `Map` keyed by the pair answers by
   * identity — where a value-keyed map answered by SameValueZero and parted from `Object.is` on ±0.
   */
  getSimpleTagged(token: Token<unknown> | Constructor, criterion: BindingTag): Binding | undefined {
    return this.#entries?.get(token)?.simple?.get(criterion);
  }

  /**
   * The multi-tag bindings whose slot's first criterion is `criterion`.
   *
   * @remarks A prefilter, not an answer: a bucket member's remaining tags still have to be matched
   * against the request — first-criterion bucketing only guarantees each candidate appears once.
   */
  getMultiTagged(token: Token<unknown> | Constructor, criterion: BindingTag): ReadonlyArray<Binding> | undefined {
    return this.#entries?.get(token)?.multi?.get(criterion);
  }

  getFastDefault(token: Token<unknown> | Constructor): Binding | undefined {
    return this.#fastDefault.get(token);
  }

  /** Summarize available slot strings for a token (for error messages). */
  availableSlotStrings(token: Token<unknown> | Constructor): Array<string> {
    return this.getAll(token).map((binding) => bindingSlotToString(binding.slot));
  }

  /** Whether the deferred tagged-slot index has had to be built. */
  get isTaggedIndexBuilt(): boolean {
    return this.#taggedIndexBuilt;
  }

  /** Whether an id-keyed operation has had to build the id index. */
  get isIdIndexBuilt(): boolean {
    return this.#byId !== undefined;
  }

  #refreshFastDefault(key: DependencyKey, entry: TokenEntry): void {
    const only = entry.bindings.length === 1 ? entry.bindings[0]! : undefined;
    if (only !== undefined && isDefaultSlotBinding(only)) {
      this.#fastDefault.set(key, only);
    } else {
      this.#fastDefault.delete(key);
    }
  }

  #ensureById(): Map<BindingIdentifier, Binding> {
    if (this.#byId === undefined) {
      const byId = new Map<BindingIdentifier, Binding>();
      if (this.#entries !== undefined) {
        for (const entry of this.#entries.values()) {
          for (const binding of entry.bindings) {
            byId.set(binding.id, binding);
          }
        }
      }
      this.#byId = byId;
    }
    return this.#byId;
  }

  // Indexes a slot that carries at least one criterion: one criterion goes in the exact map, more
  // go in the first-criterion bucket.
  #indexTagged(entry: TokenEntry, binding: Binding): void {
    const { tags } = binding.slot;
    this.#taggedIndexBuilt = true;
    if (tags.length === 1) {
      (entry.simple ??= new Map()).set(tags[0]!, binding);
    } else {
      getOrInsert((entry.multi ??= new Map()), tags[0]!, []).push(binding);
    }
  }

  #deindexTagged(entry: TokenEntry, binding: Binding): void {
    const { tags } = binding.slot;
    if (tags.length === 1) {
      if (entry.simple?.get(tags[0]!)?.id === binding.id) {
        entry.simple.delete(tags[0]!);
      }
    } else if (tags.length >= 2) {
      const bucket = entry.multi?.get(tags[0]!);
      const bindingIndex = bucket?.findIndex((candidate) => candidate.id === binding.id) ?? -1;
      // Spliced in place: nothing walks a bucket while user code runs — candidates are gathered
      // into their own array before any predicate is evaluated.
      if (bindingIndex !== -1) {
        bucket!.splice(bindingIndex, 1);
      }
    }
  }
}

/** A binding nothing has to be matched against: the default slot, no predicate. */
function isDefaultSlotBinding(binding: Binding): boolean {
  return binding.slot.tags.length === 0 && binding.predicate === undefined;
}

/** A predicate with no slot constraint: last-wins does not apply to it. */
function isPurePredicateBinding(binding: Binding): boolean {
  return binding.predicate !== undefined && binding.slot.tags.length === 0;
}
