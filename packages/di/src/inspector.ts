import type { Binding } from "#/binding";
import type { BindingKind, BindingScope, BindingIdentifier, Constructor } from "#/types";
import type { Token } from "#/token";
import type { BindingRegistry } from "#/registry";
import type { ScopeManager } from "#/scope";
import type { ResolveOptions } from "#/types";
import { tokenName } from "#/token";
import { selectBinding } from "#/binding-select";
import { effectiveBindingScope } from "#/binding-scope";

// ── Public types ──────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface BindingSnapshot {
  readonly tokenName: string;
  readonly kind: BindingKind;
  readonly scope: BindingScope;
  readonly slot: {
    readonly name?: string;
    readonly tags: ReadonlyArray<readonly [string, unknown]>;
  };
  readonly id: BindingIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ContainerSnapshot {
  readonly ownBindings: ReadonlyArray<BindingSnapshot>;
  readonly cachedSingletonCount: number;
  readonly hasParent: boolean;
  readonly isDisposed: boolean;
}

// ── Inspector ─────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export class Inspector {
  constructor(
    private readonly _registry: BindingRegistry,
    private readonly _scope: ScopeManager,
    private readonly _hasParent: boolean,
    private readonly _isDisposed: () => boolean,
  ) {}

  inspect(): ContainerSnapshot {
    const snapshots = this.allBindingSnapshots();
    return {
      ownBindings: snapshots,
      cachedSingletonCount: this._scope.getAllSingletons().size,
      hasParent: this._hasParent,
      isDisposed: this._isDisposed(),
    };
  }

  lookupBindings<Value>(token: Token<Value> | Constructor<Value>): ReadonlyArray<BindingSnapshot> {
    const bindings = this._registry.getAll(token);
    return bindings.map((binding) => this._toSnapshot(binding));
  }

  has(
    token: Token<unknown> | Constructor,
    hint?: ResolveOptions,
    parentHas?: () => boolean,
  ): boolean {
    const bindings = this._registry.getAll(token);
    if (bindings.length > 0) {
      if (hint !== undefined) {
        const ctx = {
          resolutionPath: [],
          resolutionStack: [],
          parent: undefined,
          ancestors: [],
          currentResolveHint: hint,
        };
        const match = selectBinding(bindings, hint, ctx, tokenName(token));
        if (match !== undefined) {
          return true;
        }
      } else {
        return true;
      }
    }
    return parentHas?.() ?? false;
  }

  hasOwn(token: Token<unknown> | Constructor, hint?: ResolveOptions): boolean {
    const bindings = this._registry.getAll(token);
    if (bindings.length === 0) {
      return false;
    }
    if (hint !== undefined) {
      const ctx = {
        resolutionPath: [],
        resolutionStack: [],
        parent: undefined,
        ancestors: [],
        currentResolveHint: hint,
      };
      const match = selectBinding(bindings, hint, ctx, tokenName(token));
      return match !== undefined;
    }
    return true;
  }

  private allBindingSnapshots(): ReadonlyArray<BindingSnapshot> {
    return this._registry.allBindings().map((binding) => this._toSnapshot(binding));
  }

  private _toSnapshot(binding: Binding): BindingSnapshot {
    const scope = effectiveBindingScope(binding);
    const slot: BindingSnapshot["slot"] =
      binding.slot.name !== undefined
        ? { name: binding.slot.name, tags: binding.slot.tags }
        : { tags: binding.slot.tags };
    return {
      tokenName: tokenName(binding.token),
      kind: binding.kind,
      scope,
      slot,
      id: binding.id,
    };
  }
}
