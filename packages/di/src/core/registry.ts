import type { Binding, BindingSlot } from "#core/binding";
import { bindingSlotEquals, bindingSlotToString, writableMembership, writablePredicate } from "#core/binding";
import { getOrInsert } from "#core/map-upsert";
import { advanceStateEpoch } from "#core/state-epoch";
import type { BindingTag } from "#core/tag";
import type { Token } from "#core/token";
import type { BindingConstraint, BindingIdentifier, Constructor, DependencyKey } from "#core/types";

/**
 * Everything the registry knows about a token that is more than one default-slot binding.
 *
 * @remarks A token carrying several bindings, a tagged slot or a predicate needs its list and its
 * tagged indexes; the common token — one default-slot binding and nothing else — needs neither and
 * never gets a record. The indexes stay unallocated until a tagged slot lands on the token.
 */
interface TokenRecord {
  /**
   * Registration order. An append lands in place; a removal or a displacement replaces the array,
   * so a walk that read its length first is never shifted under.
   */
  bindings: Array<Binding>;
  /**
   * The default-slot occupant — the one binding with no criterion, no predicate and no membership,
   * so last-wins gives it its slot alone. Indexed like the tagged slots, so an add finds who it
   * displaces without walking the list.
   */
  defaultOccupant: Binding | undefined;
  /** Bindings whose slot carries exactly one criterion, keyed by that interned criterion. */
  simple: Map<BindingTag, Binding> | undefined;
  /** Bindings whose slot carries two or more criteria, bucketed by their first criterion. */
  multi: Map<BindingTag, Array<Binding>> | undefined;
}

const NO_BINDINGS: ReadonlyArray<Binding> = Object.freeze([]);

/** One construction site, so every record shares a hidden class. */
function createTokenRecord(bindings: Array<Binding>): TokenRecord {
  return {
    bindings,
    defaultOccupant: undefined,
    simple: undefined,
    multi: undefined,
  };
}

/**
 * One container's binding store, indexed by token, binding id, and slot for fast lookup.
 *
 * @since 0.3.16-canary.0
 */
// One shared empty map answers every read of a registry nothing was bound into, so a container
// that only ever resolves through its parent — every per-request child — allocates no map.
const EMPTY_LONE: Map<DependencyKey, Binding> = new Map();

export class BindingRegistry {
  // Monotonic mutation counter — lets resolvers version-stamp lookup caches across a container chain.
  #version = 0;
  // The common token lives here and nowhere else: exactly one default-slot binding, so the hot read
  // of every resolve is a bare `Map.get` and a plain bind is one map write.
  #lone: Map<DependencyKey, Binding> = EMPTY_LONE;
  // Every other token — several bindings, a tagged slot, a predicate — has a record here, and a
  // token is in exactly one of the two maps. Allocated by the first token that needs a record.
  #records: Map<DependencyKey, TokenRecord> | undefined;
  // The binding the last `add` placed and where it landed: the fluent chain refines what it just
  // registered, so a refinement that follows its own add re-slots without a map probe.
  #lastAdded: Binding | undefined;
  #lastAddedRecord: TokenRecord | undefined;
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

  // Every mutation moves the process-wide epoch too, which is what lets a descendant's cache skip
  // re-summing the chain while nothing anywhere has changed.
  #bump(): void {
    this.#version += 1;
    advanceStateEpoch();
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
    this.#bump();
  }

  /**
   * Adds or replaces a binding using slot-aware last-wins. Returns the displaced binding, if any.
   *
   * @remarks The binding is stored by reference — it must come from the one binding builder, which
   * is what guarantees the single hidden class the resolver's hot reads depend on.
   */
  add(binding: Binding): Binding | undefined {
    this.#bump();
    if (binding.kind === "constant") {
      this.#heldConstantBinding = true;
    }
    const key: DependencyKey = binding.token;
    const records = this.#records;
    if (records !== undefined) {
      const record = records.get(key);
      if (record !== undefined) {
        this.#lastAdded = binding;
        this.#lastAddedRecord = record;
        return this.#addToRecord(key, record, binding);
      }
    }
    let lone = this.#lone;
    if (lone === EMPTY_LONE) {
      lone = this.#lone = new Map<DependencyKey, Binding>();
    }
    const occupant = lone.get(key);
    this.#lastAdded = binding;
    if (occupant === undefined) {
      // The common bind: a fresh token taking the lone seat, one probe and one write.
      if (this.#byId !== undefined) {
        this.#byId.set(binding.identifier, binding);
      }
      if (isDefaultSlotBinding(binding)) {
        lone.set(key, binding);
        this.#lastAddedRecord = undefined;
      } else {
        this.#lastAddedRecord = this.#createRecord(key, [binding]);
      }
      return undefined;
    }
    // Same slot, last wins: the newcomer takes the lone seat and nothing else moves.
    if (isDefaultSlotBinding(binding)) {
      lone.set(key, binding);
      this.#lastAddedRecord = undefined;
      if (this.#byId !== undefined) {
        this.#byId.delete(occupant.identifier);
        this.#byId.set(binding.identifier, binding);
      }
      return occupant;
    }
    // A second shape joins the token, which is what a record is for.
    lone.delete(key);
    this.#byId?.set(binding.identifier, binding);
    this.#lastAddedRecord = this.#createRecord(key, [occupant, binding]);
    return undefined;
  }

  /** Remove all bindings for a token. Returns removed bindings. */
  removeByToken(token: Token<unknown> | Constructor): Array<Binding> {
    this.#bump();
    this.#lastAdded = undefined;
    const lone = this.#lone.get(token);
    if (lone !== undefined) {
      this.#lone.delete(token);
      this.#byId?.delete(lone.identifier);
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
        this.#byId.delete(binding.identifier);
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
    this.#bump();
    this.#lastAdded = undefined;
    byId.delete(id);
    const key: DependencyKey = binding.token;
    if (this.#lone.get(key)?.identifier === id) {
      this.#lone.delete(key);
      return binding;
    }
    const record = this.#records?.get(key);
    if (record !== undefined) {
      const bindingIndex = record.bindings.findIndex((candidate) => candidate.identifier === id);
      // Replaced, never spliced: a walk holding the current array must not lose its place.
      if (bindingIndex !== -1) {
        record.bindings = record.bindings.toSpliced(bindingIndex, 1);
      }
      this.#deindexSlot(record, binding);
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

  /**
   * The bindings of a token that keeps a record, or none.
   *
   * @remarks For a caller whose lone-map probe has just missed: the record map is all that is left
   * to ask, and a lone binding's one-element list is never materialised here.
   */
  getRecorded(token: Token<unknown> | Constructor): ReadonlyArray<Binding> {
    return this.#records?.get(token)?.bindings ?? NO_BINDINGS;
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
    this.#bump();
    this.#lastAdded = undefined;
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
    return this.#slotOccupant(record, binding.slot) !== undefined;
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

  /** The binding whose slot is exactly these two criteria, declared in either order, or `undefined`. */
  getPairTagged(token: Token<unknown> | Constructor, first: BindingTag, second: BindingTag): Binding | undefined {
    const multi = this.#records?.get(token)?.multi;
    if (multi === undefined) {
      return undefined;
    }
    return findPairIn(multi.get(first), first, second) ?? findPairIn(multi.get(second), first, second);
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

  /**
   * Takes a live binding out of every index, lets `rewrite` change its slot or predicate, and reports
   * whether it was live; the caller registers it again with `add`.
   *
   * @remarks The binding keeps its object and its id, so the id index needs no touch and nothing
   * that holds the object has to be told. `false` means the binding was unbound or displaced since
   * it registered, and a refinement must not resurrect it.
   */
  reslot(binding: Binding, rewrite: () => void): boolean {
    const key: DependencyKey = binding.token;
    if (this.#lone.get(key) === binding) {
      this.#bump();
      this.#lastAdded = undefined;
      this.#lone.delete(key);
    } else {
      const record = this.#records?.get(key);
      const index = record === undefined ? -1 : record.bindings.indexOf(binding);
      if (record === undefined || index === -1) {
        return false;
      }
      this.#bump();
      this.#lastAdded = undefined;
      // Replaced, never spliced: a walk holding the current array must not lose its place.
      record.bindings = record.bindings.toSpliced(index, 1);
      this.#deindexSlot(record, binding);
      this.#settle(key, record);
    }
    rewrite();
    return true;
  }

  /**
   * Marks a live binding as a collection member in place, moving it out of the lone map: a member is
   * never the token's lone default answer, and nothing else indexes on membership.
   */
  setMany(binding: Binding): void {
    this.#bump();
    // Set before any (re)indexing so `#indexSlot` sees a member and leaves it out of every slot.
    writableMembership(binding).isMany = true;
    if (binding === this.#lastAdded) {
      // The chain refining what it just added: where the binding sits is known without a probe.
      const record = this.#lastAddedRecord;
      if (record === undefined) {
        this.#lone.delete(binding.token);
        this.#lastAddedRecord = this.#createRecord(binding.token, [binding]);
      } else if (record.defaultOccupant === binding) {
        record.defaultOccupant = undefined;
      }
      return;
    }
    if (this.#promoteLoneToRecord(binding.token, binding)) {
      return;
    }
    // A default occupant that becomes a member frees its slot, so drop the stale index entry. A
    // member cannot collapse a record back to lone, so this path does not settle.
    this.#clearDefaultOccupant(binding.token, binding);
  }

  /**
   * Adds a predicate to a live binding in place.
   *
   * @remarks Only ever narrows — `when()` composes with any existing predicate — so the argument is
   * never absent. Nothing indexes on the predicate, so the binding object and its id stay; a lone
   * binding moves to a record because the lone map holds default-slot bindings with no predicate.
   */
  setPredicate(binding: Binding, predicate: BindingConstraint): void {
    this.#bump();
    // Set before any (re)indexing: a predicate-only binding holds no default slot.
    writablePredicate(binding).predicate = predicate;
    if (this.#promoteLoneToRecord(binding.token, binding)) {
      return;
    }
    // The binding may have vacated the default slot, and a narrowed record can collapse back to lone.
    const record = this.#clearDefaultOccupant(binding.token, binding);
    if (record !== undefined) {
      this.#settle(binding.token, record);
    }
  }

  /**
   * Moves a binding still holding the lone seat into a fresh one-binding record, returning whether it did.
   *
   * @remarks Its field (`isMany` or `predicate`) is written before this call, so the founding
   * `#indexSlot` files it under the slot it now holds.
   */
  #promoteLoneToRecord(key: DependencyKey, binding: Binding): boolean {
    if (this.#lone.get(key) !== binding) {
      return false;
    }
    this.#lone.delete(key);
    this.#createRecord(key, [binding]);
    return true;
  }

  /** Clears the default-slot index entry a binding has vacated, returning its record if one exists. */
  #clearDefaultOccupant(key: DependencyKey, binding: Binding): TokenRecord | undefined {
    const record = this.#records?.get(key);
    if (record?.defaultOccupant === binding) {
      record.defaultOccupant = undefined;
    }
    return record;
  }

  /** Summarize available slot strings for a token (for error messages). */
  availableSlotStrings(token: Token<unknown> | Constructor): Array<string> {
    return this.getAll(token).map((binding) => bindingSlotToString(binding.slot));
  }

  #createRecord(key: DependencyKey, bindings: Array<Binding>): TokenRecord {
    const record = createTokenRecord(bindings);
    (this.#records ??= new Map<DependencyKey, TokenRecord>()).set(key, record);
    // A promoted lone binding carries its slot into the record, so index every founding binding.
    for (const binding of bindings) {
      this.#indexSlot(record, binding);
    }
    return record;
  }

  /** The binding occupying `slot` in this record, found through the slot indexes, or `undefined`. */
  #slotOccupant(record: TokenRecord, slot: BindingSlot): Binding | undefined {
    const { tags } = slot;
    if (tags.length === 0) {
      return record.defaultOccupant;
    }
    if (tags.length === 1) {
      return record.simple?.get(tags[0]!);
    }
    // Two-plus criteria are rare and can be bucketed under either criterion, so the list decides.
    return record.bindings.find(
      (candidate) => !isPurePredicateBinding(candidate) && bindingSlotEquals(candidate.slot, slot),
    );
  }

  #addToRecord(key: DependencyKey, record: TokenRecord, binding: Binding): Binding | undefined {
    // Last-wins applies only to a slot-based newcomer, and the slot indexes name its occupant
    // directly — so a member joining a collection of members displaces nobody without a list walk.
    let displacedBinding: Binding | undefined;
    if (!isPurePredicateBinding(binding)) {
      displacedBinding = this.#slotOccupant(record, binding.slot);
      if (displacedBinding !== undefined) {
        this.#byId?.delete(displacedBinding.identifier);
        this.#deindexSlot(record, displacedBinding);
      }
    }
    // A selection may be walking this list inside a `when()` predicate. An append past the length it
    // read cannot shift it, so it lands in place; a displacement replaces the array instead.
    if (displacedBinding === undefined) {
      record.bindings.push(binding);
    } else {
      record.bindings = [...record.bindings.filter((candidate) => candidate !== displacedBinding), binding];
    }
    this.#byId?.set(binding.identifier, binding);
    this.#indexSlot(record, binding);
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
      if (this.#lone === EMPTY_LONE) {
        this.#lone = new Map<DependencyKey, Binding>();
      }
      this.#lone.set(key, bindings[0]!);
    }
  }

  #ensureById(): Map<BindingIdentifier, Binding> {
    if (this.#byId === undefined) {
      const byId = new Map<BindingIdentifier, Binding>();
      for (const binding of this.#lone.values()) {
        byId.set(binding.identifier, binding);
      }
      if (this.#records !== undefined) {
        for (const record of this.#records.values()) {
          for (const binding of record.bindings) {
            byId.set(binding.identifier, binding);
          }
        }
      }
      this.#byId = byId;
    }
    return this.#byId;
  }

  // Indexes a binding by its slot so an add finds who it displaces without walking the list: the
  // default slot in `defaultOccupant`, one criterion in the exact map, more in the first-criterion
  // bucket. A collection member or a predicate-only binding occupies no slot and is left unindexed.
  #indexSlot(record: TokenRecord, binding: Binding): void {
    if (isPurePredicateBinding(binding)) {
      return;
    }
    const { tags } = binding.slot;
    if (tags.length === 0) {
      record.defaultOccupant = binding;
      return;
    }
    this.#taggedIndexBuilt = true;
    if (tags.length === 1) {
      (record.simple ??= new Map()).set(tags[0]!, binding);
    } else {
      getOrInsert((record.multi ??= new Map()), tags[0]!, []).push(binding);
    }
  }

  #deindexSlot(record: TokenRecord, binding: Binding): void {
    if (isPurePredicateBinding(binding)) {
      return;
    }
    const { tags } = binding.slot;
    if (tags.length === 0) {
      if (record.defaultOccupant?.identifier === binding.identifier) {
        record.defaultOccupant = undefined;
      }
      return;
    }
    if (tags.length === 1) {
      if (record.simple?.get(tags[0]!)?.identifier === binding.identifier) {
        record.simple.delete(tags[0]!);
      }
    } else if (tags.length >= 2) {
      const bucket = record.multi?.get(tags[0]!);
      const bindingIndex = bucket?.findIndex((candidate) => candidate.identifier === binding.identifier) ?? -1;
      // Spliced in place: nothing walks a bucket while user code runs — candidates are gathered
      // into their own array before any predicate is evaluated.
      if (bindingIndex !== -1) {
        bucket!.splice(bindingIndex, 1);
      }
    }
  }
}

/** A binding nothing has to be matched against: the default slot, no predicate, not a collection member. */
function isDefaultSlotBinding(binding: Binding): boolean {
  return binding.slot.tags.length === 0 && binding.predicate === undefined && !binding.isMany;
}

/** A binding that occupies no slot — a collection member, or a predicate with no slot constraint — so last-wins does not apply to it. */
function isPurePredicateBinding(binding: Binding): boolean {
  return binding.isMany || (binding.predicate !== undefined && binding.slot.tags.length === 0);
}

// A bucket is keyed by its members' first criterion, so the pair is read from whichever came first.
function findPairIn(
  bucket: ReadonlyArray<Binding> | undefined,
  first: BindingTag,
  second: BindingTag,
): Binding | undefined {
  if (bucket === undefined) {
    return undefined;
  }
  for (let index = 0; index < bucket.length; index += 1) {
    const { tags } = bucket[index]!.slot;
    if (tags.length === 2 && (tags[0] === first ? tags[1] === second : tags[0] === second && tags[1] === first)) {
      return bucket[index];
    }
  }
  return undefined;
}
