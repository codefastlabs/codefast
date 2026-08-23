import type { Binding } from "#/core/binding";
import { effectiveBindingScope } from "#/core/binding-scope";
import type { BindingRegistry } from "#/core/registry";
import type { Token } from "#/core/token";
import { tokenName } from "#/core/token";
import type {
  BindingIdentifier,
  BindingKind,
  BindingScope,
  BindingTag,
  ConstraintContext,
  Constructor,
  ResolveOptions,
} from "#/core/types";
import type { ScopeManager } from "#/lifecycle/scope-manager";
import { selectAllBindings } from "#/resolution/select/binding-select";

// ── Public types ─────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * A read-only view of one binding: token, kind, scope, slot, and id.
 *
 * @since 0.3.16-canary.0
 */
export interface BindingSnapshot {
  readonly tokenName: string;
  readonly kind: BindingKind;
  readonly scope: BindingScope;
  readonly slot: {
    readonly name?: string;
    readonly tags: ReadonlyArray<BindingTag>;
  };
  readonly id: BindingIdentifier;
}

/**
 * A read-only view of one container's own bindings and state.
 *
 * @since 0.3.16-canary.0
 */
export interface ContainerSnapshot {
  readonly ownBindings: ReadonlyArray<BindingSnapshot>;
  readonly cachedSingletonCount: number;
  readonly hasParent: boolean;
  readonly isDisposed: boolean;
}

// ── Inspector ────────────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * The read-only introspection surface behind a container's `inspect()`.
 *
 * @since 0.3.16-canary.0
 */
export class Inspector {
  readonly #registry: BindingRegistry;
  readonly #scope: ScopeManager;
  readonly #hasParent: boolean;
  readonly #isDisposed: () => boolean;

  constructor(registry: BindingRegistry, scope: ScopeManager, hasParent: boolean, isDisposed: () => boolean) {
    this.#registry = registry;
    this.#scope = scope;
    this.#hasParent = hasParent;
    this.#isDisposed = isDisposed;
  }

  inspect(): ContainerSnapshot {
    return {
      ownBindings: this.#registry.allBindings().map((binding) => this.#toSnapshot(binding)),
      cachedSingletonCount: this.#scope.cachedSingletons().length,
      hasParent: this.#hasParent,
      isDisposed: this.#isDisposed(),
    };
  }

  lookupBindings<Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<BindingSnapshot> {
    const bindings = this.#registry.getAll(token);
    return bindings.map((binding) => this.#toSnapshot(binding));
  }

  has(token: Token<unknown> | Constructor, options?: ResolveOptions, parentHas?: () => boolean): boolean {
    const bindings = this.#registry.getAll(token);
    if (bindings.length > 0) {
      // An existence probe answers ambiguity with `true` — several matches still exist; only
      // resolution has to pick one.
      if (options !== undefined) {
        if (selectAllBindings(bindings, options, this.#makeConstraintContext(options)).length > 0) {
          return true;
        }
      } else {
        return true;
      }
    }
    return parentHas?.() ?? false;
  }

  hasOwn(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean {
    const bindings = this.#registry.getAll(token);
    if (bindings.length === 0) {
      return false;
    }
    if (options !== undefined) {
      return selectAllBindings(bindings, options, this.#makeConstraintContext(options)).length > 0;
    }
    return true;
  }

  #makeConstraintContext(options: ResolveOptions): ConstraintContext {
    return {
      resolutionPath: [],
      resolutionStack: [],
      parent: undefined,
      ancestors: [],
      currentResolveOptions: options,
    };
  }

  #toSnapshot(binding: Binding): BindingSnapshot {
    // Aliased, not copied: slot tags are frozen where they are built, so a caller's write throws
    // instead of corrupting the registry — and the snapshot skips an allocation per binding.
    const slot: BindingSnapshot["slot"] =
      binding.slot.name !== undefined
        ? { name: binding.slot.name, tags: binding.slot.tags }
        : { tags: binding.slot.tags };
    return {
      tokenName: tokenName(binding.token),
      kind: binding.kind,
      scope: effectiveBindingScope(binding),
      slot,
      id: binding.id,
    };
  }
}
