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
  readonly ownBindings: readonly BindingSnapshot[];
  readonly bindings: readonly BindingSnapshot[];
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
      bindings: snapshots,
      cachedSingletonCount: this._scope.getAllSingletons().size,
      hasParent: this._hasParent,
      isDisposed: this._isDisposed(),
    };
  }

  lookupBindings<Value>(token: Token<Value> | Constructor<Value>): readonly BindingSnapshot[] {
    const bindings = this._registry.getAll(token);
    return bindings.map((b) => this._toSnapshot(b));
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
          materializationStack: [],
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
        materializationStack: [],
        parent: undefined,
        ancestors: [],
        currentResolveHint: hint,
      };
      const match = selectBinding(bindings, hint, ctx, tokenName(token));
      return match !== undefined;
    }
    return true;
  }

  private allBindingSnapshots(): readonly BindingSnapshot[] {
    return this._registry.allBindings().map((b) => this._toSnapshot(b));
  }

  private _toSnapshot(b: Binding): BindingSnapshot {
    const scope = effectiveBindingScope(b);
    const slot: BindingSnapshot["slot"] =
      b.slot.name !== undefined ? { name: b.slot.name, tags: b.slot.tags } : { tags: b.slot.tags };
    return {
      tokenName: tokenName(b.token),
      kind: b.kind,
      scope,
      slot,
      id: b.id,
    };
  }
}
