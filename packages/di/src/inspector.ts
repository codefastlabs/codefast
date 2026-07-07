import type { Binding } from "#/binding";
import { effectiveBindingScope } from "#/binding-scope";
import { selectBinding } from "#/binding-select";
import type { BindingRegistry } from "#/registry";
import type { ScopeManager } from "#/scope";
import type { Token } from "#/token";
import { tokenName } from "#/token";
import type {
  BindingIdentifier,
  BindingKind,
  BindingScope,
  BindingTag,
  ConstraintContext,
  Constructor,
  ResolveOptions,
} from "#/types";

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
    readonly tags: ReadonlyArray<BindingTag>;
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

  has(token: Token<unknown> | Constructor, options?: ResolveOptions, parentHas?: () => boolean): boolean {
    const bindings = this._registry.getAll(token);
    if (bindings.length > 0) {
      if (options !== undefined) {
        if (selectBinding(bindings, options, this._makeConstraintContext(options), tokenName(token)) !== undefined) {
          return true;
        }
      } else {
        return true;
      }
    }
    return parentHas?.() ?? false;
  }

  hasOwn(token: Token<unknown> | Constructor, options?: ResolveOptions): boolean {
    const bindings = this._registry.getAll(token);
    if (bindings.length === 0) {
      return false;
    }
    if (options !== undefined) {
      return selectBinding(bindings, options, this._makeConstraintContext(options), tokenName(token)) !== undefined;
    }
    return true;
  }

  private _makeConstraintContext(options: ResolveOptions): ConstraintContext {
    return {
      resolutionPath: [],
      resolutionStack: [],
      parent: undefined,
      ancestors: [],
      currentResolveOptions: options,
    };
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
