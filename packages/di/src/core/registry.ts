import type { Binding } from "#/core/binding";
import { bindingSlotEquals, bindingSlotToString } from "#/core/binding";
import { getOrInsert } from "#/core/map-upsert";
import type { BindingTag } from "#/core/tag";
import type { Token } from "#/core/token";
import type { BindingIdentifier, Constructor, DependencyKey } from "#/core/types";

/**
 * Everything the registry knows about a token that is more than one default-slot binding.
 *
 * @remarks A token carrying several bindings, a tagged slot or a predicate needs its list and its
 * tagged indexes; the common token — one default-slot binding and nothing else — needs neither and
 * never gets a record. The indexes stay unallocated until a tagged slot lands on the token.
 */
interface TokenRecord {
  /** Registration order, copy-on-write: `add` and `removeById` replace it, never splice it. */
  bindings: ReadonlyArray<Binding>;
  /** Bindings whose slot carries exactly one criterion, keyed by that interned criterion. */
  simple: Map<BindingTag, Binding> | undefined;
  /** Bindings whose slot carries two or more criteria, bucketed by their first criterion. */
  multi: Map<BindingTag, Array<Binding>> | undefined;
}

const NO_BINDINGS: ReadonlyArray<Binding> = Object.freeze([]);

/** One construction site, so every record shares a hidden class. */
function createTokenRecord(bindings: ReadonlyArray<Binding>): TokenRecord {
  return {
    bindings,
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
  // The common token lives here and nowhere else: exactly one default-slot binding, so the hot read
  // of every resolve is a bare `Map.get` and a plain bind is one map write.
  readonly #lone = new Map<DependencyKey, Binding>();
  // Every other token — several bindings, a tagged slot, a predicate — has a record here, and a
  // token is in exactly one of the two maps. Allocated by the first token that needs a record.
  #records: Map<DependencyKey, TokenRecord> | undefined;
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

  /** Whether the deferred tagged-slot index has had to be built. */
  get isTaggedIndexBuilt(): boolean {
    return this.#taggedIndexBuilt;
  }

  /** Whether an id-keyed operation has had to build the id index. */
  get isIdIndexBuilt(): boolean {
    return this.#byId !== undefined;
  }

  /** Whether a token carrying more than one default-slot binding has had to build the record map. */
  get isRecordMapBuilt(): boolean {
    return this.#records !== undefined;
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
    const record = this.#records?.get(key);
    if (record !== undefined) {
      return this.#addToRecord(key, record, binding);
    }
    const lone = this.#lone.get(key);
    if (lone === undefined) {
      this.#byId?.set(binding.id, binding);
      if (isDefaultSlotBinding(binding)) {
        this.#lone.set(key, binding);
      } else {
        this.#indexTagged(this.#createRecord(key, [binding]), binding);
      }
      return undefined;
    }
    // Same slot, last wins: the newcomer takes the lone seat and nothing else moves.
    if (isDefaultSlotBinding(binding)) {
      this.#lone.set(key, binding);
      if (this.#byId !== undefined) {
        this.#byId.delete(lone.id);
        this.#byId.set(binding.id, binding);
      }
      return lone;
    }
    // A second shape joins the token, which is what a record is for.
    this.#lone.delete(key);
    this.#byId?.set(binding.id, binding);
    this.#indexTagged(this.#createRecord(key, [lone, binding]), binding);
    return undefined;
  }

  /** Remove all bindings for a token. Returns removed bindings. */
  removeByToken(token: Token<unknown> | Constructor): Array<Binding> {
    this.#version += 1;
    const lone = this.#lone.get(token);
    if (lone !== undefined) {
      this.#lone.delete(token);
      this.#byId?.delete(lone.id);
      return [lone];
    }
    const records = this.#records;
    const record = records?.get(token);
    if (records === undefined || record === undefined) {
      return [];
    }
    records.delete(token);
    if (this.#byId !== undefined) {
      for (const binding of record.bindings) {
        this.#byId.delete(binding.id);
      }
    }
    return [...record.bindings];
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
    if (this.#lone.get(key)?.id === id) {
      this.#lone.delete(key);
      return binding;
    }
    const record = this.#records?.get(key);
    if (record !== undefined) {
      const bindingIndex = record.bindings.findIndex((candidate) => candidate.id === id);
      // Copy-on-write, like `add`: a walk holding the current array must not lose its place.
      if (bindingIndex !== -1) {
        record.bindings = record.bindings.toSpliced(bindingIndex, 1);
      }
      this.#deindexTagged(record, binding);
      this.#settle(key, record);
    }
    return binding;
  }

  /**
   * Get all bindings for a token.
   *
   * @remarks Allocates a one-element list for a lone default-slot binding, so a hot path asks
   * `getFastDefault()` first and reaches here only for a token that keeps a record.
   */
  getAll(token: Token<unknown> | Constructor): ReadonlyArray<Binding> {
    const record = this.#records?.get(token);
    if (record !== undefined) {
      return record.bindings;
    }
    const lone = this.#lone.get(token);
    return lone === undefined ? NO_BINDINGS : [lone];
  }

  /** How many bindings a token holds, without materialising a lone binding's list. */
  countBindings(token: Token<unknown> | Constructor): number {
    const record = this.#records?.get(token);
    if (record !== undefined) {
      return record.bindings.length;
    }
    return this.#lone.has(token) ? 1 : 0;
  }

  /** Get binding by ID. */
  getById(id: BindingIdentifier): Binding | undefined {
    return this.#ensureById().get(id);
  }

  /** Check if any binding exists for token. */
  has(token: Token<unknown> | Constructor): boolean {
    // A record is dropped with its last binding, so presence in either map is the whole answer. The
    // size read keeps a container that never bound anything — every per-request child — off the probe.
    return (
      (this.#lone.size !== 0 && this.#lone.has(token)) || (this.#records !== undefined && this.#records.has(token))
    );
  }

  /** All bindings in the registry. */
  allBindings(): ReadonlyArray<Binding> {
    if (this.#lone.size === 0 && this.#records === undefined) {
      return NO_BINDINGS;
    }
    const allBindings: Array<Binding> = [...this.#lone.values()];
    if (this.#records !== undefined) {
      for (const record of this.#records.values()) {
        allBindings.push(...record.bindings);
      }
    }
    return allBindings;
  }

  /** Remove all bindings. Returns all removed. */
  clear(): ReadonlyArray<Binding> {
    this.#version += 1;
    const all = this.allBindings();
    this.#lone.clear();
    this.#records?.clear();
    this.#byId?.clear();
    return all;
  }

  /** Whether a slot-based binding currently occupies `binding`'s slot, so adding it would displace. */
  hasSlotOccupant(binding: Binding): boolean {
    if (isPurePredicateBinding(binding)) {
      return false;
    }
    if (this.#lone.has(binding.token)) {
      // The lone seat is the default slot, so only a default-slot newcomer collides with it.
      return binding.slot.tags.length === 0;
    }
    const record = this.#records?.get(binding.token);
    if (record === undefined) {
      return false;
    }
    return record.bindings.some(
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
    return this.#records?.get(token)?.simple?.get(criterion);
  }

  /**
   * The multi-tag bindings whose slot's first criterion is `criterion`.
   *
   * @remarks A prefilter, not an answer: a bucket member's remaining tags still have to be matched
   * against the request — first-criterion bucketing only guarantees each candidate appears once.
   */
  getMultiTagged(token: Token<unknown> | Constructor, criterion: BindingTag): ReadonlyArray<Binding> | undefined {
    return this.#records?.get(token)?.multi?.get(criterion);
  }

  /** A token's lone default-slot binding — the first read of every synchronous resolve. */
  getFastDefault(token: Token<unknown> | Constructor): Binding | undefined {
    return this.#lone.get(token);
  }

  /** Summarize available slot strings for a token (for error messages). */
  availableSlotStrings(token: Token<unknown> | Constructor): Array<string> {
    return this.getAll(token).map((binding) => bindingSlotToString(binding.slot));
  }

  #createRecord(key: DependencyKey, bindings: ReadonlyArray<Binding>): TokenRecord {
    const record = createTokenRecord(bindings);
    (this.#records ??= new Map<DependencyKey, TokenRecord>()).set(key, record);
    return record;
  }

  #addToRecord(key: DependencyKey, record: TokenRecord, binding: Binding): Binding | undefined {
    // Only apply last-wins for slot-based bindings (not predicate-only)
    let displacedBinding: Binding | undefined;
    if (!isPurePredicateBinding(binding)) {
      displacedBinding = record.bindings.find(
        (candidate) => !isPurePredicateBinding(candidate) && bindingSlotEquals(candidate.slot, binding.slot),
      );
      if (displacedBinding !== undefined) {
        this.#byId?.delete(displacedBinding.id);
        this.#deindexTagged(record, displacedBinding);
      }
    }
    // Copy-on-write: a selection may be walking the current list inside a `when()` predicate, so
    // mutation replaces the array and never splices one that has been handed out.
    record.bindings =
      displacedBinding === undefined
        ? [...record.bindings, binding]
        : [...record.bindings.filter((candidate) => candidate !== displacedBinding), binding];
    this.#byId?.set(binding.id, binding);
    this.#indexTagged(record, binding);
    this.#settle(key, record);
    return displacedBinding;
  }

  // A record that shrank to one default-slot binding goes back to the lone map; an empty one goes.
  #settle(key: DependencyKey, record: TokenRecord): void {
    const { bindings } = record;
    if (bindings.length === 0) {
      this.#records!.delete(key);
    } else if (bindings.length === 1 && isDefaultSlotBinding(bindings[0]!)) {
      this.#records!.delete(key);
      this.#lone.set(key, bindings[0]!);
    }
  }

  #ensureById(): Map<BindingIdentifier, Binding> {
    if (this.#byId === undefined) {
      const byId = new Map<BindingIdentifier, Binding>();
      for (const binding of this.#lone.values()) {
        byId.set(binding.id, binding);
      }
      if (this.#records !== undefined) {
        for (const record of this.#records.values()) {
          for (const binding of record.bindings) {
            byId.set(binding.id, binding);
          }
        }
      }
      this.#byId = byId;
    }
    return this.#byId;
  }

  // Indexes a slot that carries at least one criterion: one criterion goes in the exact map, more
  // go in the first-criterion bucket. An untagged binding has nothing to index.
  #indexTagged(record: TokenRecord, binding: Binding): void {
    const { tags } = binding.slot;
    if (tags.length === 0) {
      return;
    }
    this.#taggedIndexBuilt = true;
    if (tags.length === 1) {
      (record.simple ??= new Map()).set(tags[0]!, binding);
    } else {
      getOrInsert((record.multi ??= new Map()), tags[0]!, []).push(binding);
    }
  }

  #deindexTagged(record: TokenRecord, binding: Binding): void {
    const { tags } = binding.slot;
    if (tags.length === 1) {
      if (record.simple?.get(tags[0]!)?.id === binding.id) {
        record.simple.delete(tags[0]!);
      }
    } else if (tags.length >= 2) {
      const bucket = record.multi?.get(tags[0]!);
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
