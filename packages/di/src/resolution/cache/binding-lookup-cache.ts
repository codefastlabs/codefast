/**
 * Options-less token → terminal binding, memoized per container chain.
 *
 * @remarks Each cache links to its parent's, so a child answers from its own chain without walking
 * the container hierarchy again.
 */
import type { Binding } from "#/core/binding";
import { getOrInsertComputed } from "#/core/map-upsert";
import type { BindingRegistry } from "#/core/registry";
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
 * Alias folding gives up past this many hops and defers to the full resolve loop, whose
 * Set-based traversal detects genuine cycles exactly rather than by an arbitrary cap.
 *
 * @since 0.5.0-canary.8
 */
export const ALIAS_HOP_LIMIT = 32;

/**
 * @since 0.5.0-canary.8
 */
const newNameToEntryMap = <Owner>(): Map<string, DefaultLookupEntry<Owner> | null> => new Map();

const newTagToEntryMap = <Owner>(): Map<BindingTag, DefaultLookupEntry<Owner> | null> => new Map();

/**
 * A version-stamped cache of binding lookups by token, name, and tag across the container chain.
 *
 * @since 0.5.0-canary.9
 */
export class BindingLookupCache<Owner> {
  readonly #byToken = new Map<Token<unknown> | Constructor, DefaultLookupEntry<Owner> | null>();
  #version = -1;
  // One entry in front of the map: the two shapes that reach here — an alias, and a token owned by
  // a parent — are both resolved in a loop over the same token. `null` is a real answer, so absence
  // is tracked by the token slot rather than by the entry.
  #lastToken: Token<unknown> | Constructor | undefined;
  #lastEntry: DefaultLookupEntry<Owner> | null = null;
  readonly #byTokenAndName = new Map<Token<unknown> | Constructor, Map<string, DefaultLookupEntry<Owner> | null>>();
  #namedVersion = -1;
  readonly #byTokenAndTag = new Map<Token<unknown> | Constructor, Map<BindingTag, DefaultLookupEntry<Owner> | null>>();
  #taggedVersion = -1;
  // One entry in front of the tag map, and the map is not written until a second distinct request
  // shape appears: a per-request child usually asks one (token, tag) once, and the inner-map
  // allocation was that shape's whole regression when this memo landed.
  #lastTagToken: Token<unknown> | Constructor | undefined;
  #lastTag: BindingTag | undefined;
  #lastTaggedEntry: DefaultLookupEntry<Owner> | null = null;

  readonly #registry: BindingRegistry;
  readonly #owner: Owner;
  readonly #parent: BindingLookupCache<Owner> | undefined;

  constructor(registry: BindingRegistry, owner: Owner, parent: BindingLookupCache<Owner> | undefined) {
    this.#registry = registry;
    this.#owner = owner;
    this.#parent = parent;
  }

  /** Summed registry versions of this cache's whole chain — the memo stamp. */
  chainVersion(): number {
    let version = this.#registry.version;
    for (let cache = this.#parent; cache !== undefined; cache = cache.#parent) {
      version += cache.#registry.version;
    }
    return version;
  }

  /** `null` when the token's shape needs the full selection path. */
  defaultEntry(token: Token<unknown> | Constructor): DefaultLookupEntry<Owner> | null {
    const version = this.chainVersion();
    if (version !== this.#version) {
      this.#byToken.clear();
      this.#version = version;
      this.#lastToken = undefined;
    } else if (token === this.#lastToken) {
      return this.#lastEntry;
    }
    let entry = this.#byToken.get(token);
    if (entry === undefined) {
      entry = this.#foldAliases(token);
      this.#byToken.set(token, entry);
    }
    this.#lastToken = token;
    this.#lastEntry = entry;
    return entry;
  }

  /** `null` when the name's shape needs the full selection path. */
  namedEntry(token: Token<unknown> | Constructor, name: string): DefaultLookupEntry<Owner> | null {
    const version = this.chainVersion();
    if (version !== this.#namedVersion) {
      this.#byTokenAndName.clear();
      this.#namedVersion = version;
    }
    // Computed, not eager: this runs on every named resolve, and the eager form would allocate a
    // Map per call only to discard it on the hit that follows.
    const byName = getOrInsertComputed(this.#byTokenAndName, token, newNameToEntryMap);
    let entry = byName.get(name);
    if (entry === undefined) {
      entry = this.#findNamedInChain(token, name);
      byName.set(name, entry);
    }
    return entry;
  }

  /** `null` when the tag's shape needs the full selection path. */
  taggedEntry(token: Token<unknown> | Constructor, tag: BindingTag): DefaultLookupEntry<Owner> | null {
    const version = this.chainVersion();
    if (version !== this.#taggedVersion) {
      this.#byTokenAndTag.clear();
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
      const byTag = getOrInsertComputed(this.#byTokenAndTag, token, newTagToEntryMap);
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

  #findNamedInChain(token: Token<unknown> | Constructor, name: string): DefaultLookupEntry<Owner> | null {
    const named = this.#registry.getSimpleNamed(token, name);
    if (named !== undefined) {
      // Predicates need a live context; aliases carry options through the full path.
      if (named.predicate !== undefined || named.kind === "alias") {
        return null;
      }
      return { binding: named, owner: this.#owner };
    }
    if (this.#registry.has(token)) {
      return null;
    }
    return this.#parent === undefined ? null : this.#parent.#findNamedInChain(token, name);
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
