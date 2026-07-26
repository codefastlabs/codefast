/**
 * Memoized options-less binding lookup across a container chain.
 *
 * A resolve that carries no options — the overwhelming majority — only needs to know which
 * binding a token ends at and which container owns it. That answer is stable until some registry
 * in the chain mutates, so it is memoized and stamped with the summed registry versions of the
 * whole chain: any bind, unbind or in-place refinement anywhere above or below moves the sum and
 * drops the memo wholesale.
 *
 * Shapes the fast lane cannot answer (a predicate to evaluate, several candidate slots, an alias
 * loop longer than {@link ALIAS_HOP_LIMIT}) memoize as `null`, which routes the caller to the
 * full selection path rather than being recomputed each time.
 *
 * Caches form their own parent chain, mirroring the resolvers'. That is deliberate: walking the
 * chain needs each level's private state, and `#private` access is per class, not per instance.
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
 * @since 0.5.0-canary.7
 */
export interface DefaultLookupEntry<Owner> {
  readonly binding: Binding;
  readonly owner: Owner;
}

/**
 * Alias folding gives up past this many hops and defers to the full resolve loop, whose
 * Set-based traversal detects genuine cycles exactly rather than by an arbitrary cap.
 *
 * @since 0.5.0-canary.7
 */
export const ALIAS_HOP_LIMIT = 32;

/**
 * @since 0.5.0-canary.7
 */
export class BindingLookupCache<Owner> {
  readonly #byToken = new Map<Token<unknown> | Constructor, DefaultLookupEntry<Owner> | null>();
  #version = -1;
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
    }
    let entry = this.#byToken.get(token);
    if (entry === undefined) {
      entry = this.#foldAliases(token);
      this.#byToken.set(token, entry);
    }
    return entry;
  }

  /** `null` when the name's shape needs the full selection path. */
  namedEntry(token: Token<unknown> | Constructor, name: string): DefaultLookupEntry<Owner> | null {
    const version = this.chainVersion();
    if (version !== this.#namedVersion) {
      this.#byTokenAndName.clear();
      this.#namedVersion = version;
    }
    // ✓ TS6.0: Map.getOrInsert (ES2025)
    const byName = this.#byTokenAndName.getOrInsert(token, new Map<string, DefaultLookupEntry<Owner> | null>());
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
