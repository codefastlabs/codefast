/**
 * Options-less token → terminal binding, memoized per container chain.
 *
 * @see `ARCHITECTURE.md` — why these caches form their own parent chain.
 */
import type { Binding } from "#/binding";
import type { BindingRegistry } from "#/registry";
import type { Token } from "#/token";
import type { Constructor } from "#/types";

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
    // Computed, not eager: this runs on every named resolve, and `getOrInsert(token, new Map())`
    // would allocate a Map per call only to discard it on the hit that follows.
    const byName = this.#byTokenAndName.getOrInsertComputed(token, newNameToEntryMap);
    let entry = byName.get(name);
    if (entry === undefined) {
      entry = this.#findNamedInChain(token, name);
      byName.set(name, entry);
    }
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
}
