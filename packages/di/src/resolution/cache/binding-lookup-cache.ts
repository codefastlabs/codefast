/**
 * Options-less token → terminal binding, memoized per container chain.
 *
 * @remarks Each cache links to its parent's, so a child answers from its own chain without walking
 * the container hierarchy again.
 */
import type { Binding } from "#/core/binding";
import { getOrInsertComputed } from "#/core/map-upsert";
import type { BindingRegistry } from "#/core/registry";
import { stateEpoch } from "#/core/state-epoch";
import type { BindingTag } from "#/core/tag";
import type { Token } from "#/core/token";
import type { Constructor } from "#/core/types";

/**
 * A token's terminal binding with alias hops already folded, plus the container that owns it.
 *
 * @typeParam Owner - the resolver type, kept generic so this module stays free of resolver internals
 *
 * @since 0.5.0-canary.8
 */
export interface DefaultLookupEntry<Owner> {
  readonly binding: Binding;
  readonly owner: Owner;
}

/**
 * A root-level collection read, memoized until any registry in the chain changes.
 *
 * @remarks `values` is kept only while every member is a hook-free constant or a hook-free singleton
 * whose instance is cached, and `activationVersion` is the chain's activation version that promise was
 * made under.
 *
 * @since 0.10.0
 */
export interface CollectionEntry {
  readonly candidates: ReadonlyArray<Binding>;
  values: ReadonlyArray<unknown> | undefined;
  activationVersion: number;
}

/**
 * Alias folding gives up past this many hops and defers to the full resolve loop, whose
 * Set-based traversal detects genuine cycles exactly rather than by an arbitrary cap.
 *
 * @since 0.5.0-canary.8
 */
export const ALIAS_HOP_LIMIT = 32;

const newTagToEntryMap = <Owner>(): Map<BindingTag, DefaultLookupEntry<Owner> | null> => new Map();
const newNameToTagMap = <Owner>(): Map<BindingTag, Map<BindingTag, DefaultLookupEntry<Owner> | null>> => new Map();

/**
 * A version-stamped cache of binding lookups by token and criterion across the container chain.
 *
 * @since 0.5.0-canary.9
 */
export class BindingLookupCache<Owner> {
  #byToken: Map<Token<unknown> | Constructor, DefaultLookupEntry<Owner> | null> | undefined;
  #version = -1;
  // The last chain sum and the epoch it was taken at.
  #chainVersion = -1;
  #chainEpoch = -1;
  // One entry in front of the map, and the map is not written until a second distinct token appears
  // in one generation: the two shapes that reach here — an alias, and a token owned by a parent —
  // are both resolved in a loop over the same token. `null` is a real answer, so absence is tracked
  // by the token slot rather than by the entry.
  #lastToken: Token<unknown> | Constructor | undefined;
  #lastEntry: DefaultLookupEntry<Owner> | null = null;
  #byTokenAndTag: Map<Token<unknown> | Constructor, Map<BindingTag, DefaultLookupEntry<Owner> | null>> | undefined;
  #taggedVersion = -1;
  #byTokenNameAndTag:
    | Map<Token<unknown> | Constructor, Map<BindingTag, Map<BindingTag, DefaultLookupEntry<Owner> | null>>>
    | undefined;
  #pairVersion = -1;
  // One entry in front of the tag map, and the map is not written until a second distinct request
  // shape appears: a per-request child usually asks one (token, tag) once, and the inner-map
  // allocation was that shape's whole regression when this memo landed.
  #lastTagToken: Token<unknown> | Constructor | undefined;
  #lastTag: BindingTag | undefined;
  #lastTaggedEntry: DefaultLookupEntry<Owner> | null = null;
  // Root-level collections by token, stamped with the chain version like the two memos above.
  #collections: Map<Token<unknown> | Constructor, CollectionEntry> | undefined;
  #collectionsVersion = -1;

  readonly #registry: BindingRegistry;
  readonly #owner: Owner;
  readonly #parent: BindingLookupCache<Owner> | undefined;

  constructor(registry: BindingRegistry, owner: Owner, parent: BindingLookupCache<Owner> | undefined) {
    this.#registry = registry;
    this.#owner = owner;
    this.#parent = parent;
  }

  /** Whether a second distinct token or tag has had to allocate a memo map behind the one-entry fronts. */
  get isMemoBuilt(): boolean {
    return this.#byToken !== undefined || this.#byTokenAndTag !== undefined || this.#byTokenNameAndTag !== undefined;
  }

  /**
   * Summed registry versions of this cache's whole chain — the memo stamp.
   *
   * @remarks Re-summed only when the process-wide state epoch has moved since the last sum: no
   * registry anywhere changed in between, so no registry in this chain did either.
   */
  chainVersion(): number {
    // A root's sum is its own version: one field read, cheaper than the memo it would stamp.
    if (this.#parent === undefined) {
      return this.#registry.version;
    }
    const epoch = stateEpoch();
    if (epoch === this.#chainEpoch) {
      return this.#chainVersion;
    }
    let version = this.#registry.version;
    for (let cache: BindingLookupCache<Owner> | undefined = this.#parent; cache !== undefined; cache = cache.#parent) {
      version += cache.#registry.version;
    }
    this.#chainEpoch = epoch;
    this.#chainVersion = version;
    return version;
  }

  /** `null` when the token's shape needs the full selection path. */
  defaultEntry(token: Token<unknown> | Constructor): DefaultLookupEntry<Owner> | null {
    const version = this.chainVersion();
    if (version !== this.#version) {
      this.#byToken?.clear();
      this.#version = version;
      this.#lastToken = undefined;
    } else if (token === this.#lastToken) {
      return this.#lastEntry;
    }
    let entry: DefaultLookupEntry<Owner> | null | undefined;
    if (this.#lastToken === undefined) {
      // First token this cache generation sees: answer from the walk and defer the map entirely.
      entry = this.#foldAliases(token);
    } else {
      const byToken = (this.#byToken ??= new Map<Token<unknown> | Constructor, DefaultLookupEntry<Owner> | null>());
      entry = byToken.get(token);
      if (entry === undefined) {
        entry = this.#foldAliases(token);
        byToken.set(token, entry);
      }
    }
    this.#lastToken = token;
    this.#lastEntry = entry;
    return entry;
  }

  /** `null` when the tag's shape needs the full selection path. */
  taggedEntry(token: Token<unknown> | Constructor, tag: BindingTag): DefaultLookupEntry<Owner> | null {
    const version = this.chainVersion();
    if (version !== this.#taggedVersion) {
      this.#byTokenAndTag?.clear();
      this.#taggedVersion = version;
      this.#lastTagToken = undefined;
      this.#lastTag = undefined;
    } else if (token === this.#lastTagToken && tag === this.#lastTag) {
      return this.#lastTaggedEntry;
    }
    let entry: DefaultLookupEntry<Owner> | null | undefined;
    if (this.#lastTagToken === undefined) {
      // First shape this cache generation sees: answer from the walk and defer the map entirely.
      entry = this.#findTaggedInChain(token, tag);
    } else {
      // Keyed by the criterion object itself: criteria are interned, so identity is the slot
      // contract's own `Object.is` — the same exactness the registry's tagged index relies on.
      const byTag = getOrInsertComputed(
        (this.#byTokenAndTag ??= new Map<
          Token<unknown> | Constructor,
          Map<BindingTag, DefaultLookupEntry<Owner> | null>
        >()),
        token,
        newTagToEntryMap,
      );
      entry = byTag.get(tag);
      if (entry === undefined) {
        entry = this.#findTaggedInChain(token, tag);
        byTag.set(tag, entry);
      }
    }
    this.#lastTagToken = token;
    this.#lastTag = tag;
    this.#lastTaggedEntry = entry;
    return entry;
  }

  /**
   * The memoized entry for a request carrying a name and one tag, or `null` when the answer is not this lane's.
   *
   * @remarks Same contract as the one-criterion memo: a predicate needs a live context and an alias
   * carries options through the full path, so both decline; a registry that holds the token without the
   * exact slot declines too, leaving the parent walk to the full lookup.
   */
  namedTaggedEntry(
    token: Token<unknown> | Constructor,
    nameCriterion: BindingTag,
    tag: BindingTag,
  ): DefaultLookupEntry<Owner> | null {
    const version = this.chainVersion();
    if (version !== this.#pairVersion) {
      this.#byTokenNameAndTag?.clear();
      this.#pairVersion = version;
    }
    const byName = getOrInsertComputed(
      (this.#byTokenNameAndTag ??= new Map<
        Token<unknown> | Constructor,
        Map<BindingTag, Map<BindingTag, DefaultLookupEntry<Owner> | null>>
      >()),
      token,
      newNameToTagMap,
    );
    const byTag = getOrInsertComputed(byName, nameCriterion, newTagToEntryMap);
    let entry = byTag.get(tag);
    if (entry === undefined) {
      entry = this.#findPairInChain(token, nameCriterion, tag);
      byTag.set(tag, entry);
    }
    return entry;
  }

  #findPairInChain(
    token: Token<unknown> | Constructor,
    nameCriterion: BindingTag,
    tag: BindingTag,
  ): DefaultLookupEntry<Owner> | null {
    const found = this.#registry.getPairTagged(token, nameCriterion, tag);
    if (found !== undefined) {
      return found.predicate !== undefined || found.kind === "alias" ? null : { binding: found, owner: this.#owner };
    }
    if (this.#registry.has(token)) {
      return null;
    }
    return this.#parent === undefined ? null : this.#parent.#findPairInChain(token, nameCriterion, tag);
  }

  /** The memoized root-level collection for a token, or `undefined` once the chain changed since it was stored. */
  collection(token: Token<unknown> | Constructor): CollectionEntry | undefined {
    const version = this.chainVersion();
    if (version !== this.#collectionsVersion) {
      this.#collections?.clear();
      this.#collectionsVersion = version;
      return undefined;
    }
    return this.#collections?.get(token);
  }

  /** Stores a root-level collection under the chain version the last `collection()` read stamped. */
  rememberCollection(token: Token<unknown> | Constructor, entry: CollectionEntry): void {
    (this.#collections ??= new Map<Token<unknown> | Constructor, CollectionEntry>()).set(token, entry);
  }

  #foldAliases(token: Token<unknown> | Constructor): DefaultLookupEntry<Owner> | null {
    let current = token;
    for (let hop = 0; hop < ALIAS_HOP_LIMIT; hop += 1) {
      const entry = this.#findDefaultInChain(current);
      if (entry === null) {
        return null;
      }
      if (entry.binding.kind !== "alias") {
        return entry;
      }
      current = entry.binding.target;
    }
    return null;
  }

  #findDefaultInChain(token: Token<unknown> | Constructor): DefaultLookupEntry<Owner> | null {
    const fast = this.#registry.getFastDefault(token);
    if (fast !== undefined) {
      return { binding: fast, owner: this.#owner };
    }
    // A level with non-fast bindings (multi-slot / predicate) needs full selection — bail.
    if (this.#registry.has(token)) {
      return null;
    }
    return this.#parent === undefined ? null : this.#parent.#findDefaultInChain(token);
  }

  #findTaggedInChain(token: Token<unknown> | Constructor, tag: BindingTag): DefaultLookupEntry<Owner> | null {
    const tagged = this.#registry.getSimpleTagged(token, tag);
    if (tagged !== undefined) {
      // Predicates need a live context; aliases carry options through the full path.
      if (tagged.predicate !== undefined || tagged.kind === "alias") {
        return null;
      }
      return { binding: tagged, owner: this.#owner };
    }
    if (this.#registry.has(token)) {
      return null;
    }
    return this.#parent === undefined ? null : this.#parent.#findTaggedInChain(token, tag);
  }
}
