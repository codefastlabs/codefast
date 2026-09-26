/**
 * Per binding: does resolving it have to go through the activation pipeline?
 *
 * @remarks Versioned on the lifecycle manager plus the own registry, since `onActivation` can be
 * registered at any time and a rebind mints binding ids the memo must not keep forever.
 */
import type { Binding } from "#core/binding";
import { NO_ACTIVATION_STAMP } from "#core/binding";
import type { BindingRegistry } from "#core/registry";
import type { LifecycleManager } from "#lifecycle/lifecycle-manager";
import type { ClassIntrospector } from "#resolution/cache/class-introspector";

/**
 * A per-binding cache of whether activation work — hooks or `@postConstruct` — is needed on resolve.
 *
 * @since 0.5.0-canary.8
 */
export class ActivationNeedCache {
  readonly #lifecycle: LifecycleManager;
  readonly #classes: ClassIntrospector;
  readonly #registry: BindingRegistry;

  constructor(lifecycle: LifecycleManager, classes: ClassIntrospector, registry: BindingRegistry) {
    this.#lifecycle = lifecycle;
    this.#classes = classes;
    this.#registry = registry;
  }

  /** Whether an answer the early returns could not give has had to allocate the memo. */

  needsActivation<Value>(binding: Binding<Value>): boolean {
    // The chain writes a binding's own hook in place with no version anything here can see, so it
    // is read fresh on every call; the memo covers only container hooks and lifecycle metadata.
    if (binding.kind !== "alias" && binding.activationHook !== undefined) {
      return true;
    }
    const lifecycleVersion = this.#lifecycle.activationVersion;
    // No hooks registered anywhere and none on the binding: only classes can still surprise us,
    // via a @postConstruct we have not looked for yet.
    if (lifecycleVersion === 0 && binding.kind !== "class" && binding.kind !== "alias") {
      return false;
    }
    // The stamp is the version pair the answer was computed under, doubled, plus the answer: a
    // registry or lifecycle mutation moves the version and retires every stamp at once.
    const stampBase = (lifecycleVersion + this.#registry.version) * 2;
    const stamp = binding.activationStamp;
    if (stamp === stampBase) {
      return false;
    }
    if (stamp === stampBase + 1) {
      return true;
    }
    const needsActivation =
      binding.kind === "class" ? this.#classNeedsActivation(binding) : this.#nonClassNeedsActivation(binding);
    binding.activationStamp = needsActivation ? stampBase + 1 : stampBase;
    return needsActivation;
  }

  /**
   * Settles a class binding's answer once its lifecycle metadata has actually been read, which
   * only happens on the first instantiation.
   *
   * @returns the answer to use for this resolve — possibly now `false` where it was a
   * conservative `true`.
   */
  refreshAfterFirstInstantiation<Value>(binding: Binding<Value>, needsActivation: boolean): boolean {
    // A class binding answers `false` only once its lifecycle metadata is known, so only a conservative
    // `true` can still settle, and a `false` needs no second look at the class.
    if (
      !needsActivation ||
      binding.kind !== "class" ||
      this.#classes.knownPostConstruct(binding.target) !== undefined
    ) {
      return needsActivation;
    }
    this.#classes.discoverPostConstruct(binding.target);
    binding.activationStamp = NO_ACTIVATION_STAMP;
    return this.needsActivation(binding);
  }

  // Own hooks are answered before the memo, so both computations cover the memoizable rest only.
  #classNeedsActivation<Value>(binding: Binding<Value> & { kind: "class" }): boolean {
    if (this.#lifecycle.hasActivationHandlers(binding.token)) {
      return true;
    }
    // Unknown lifecycle metadata: activate once so the first instantiation can settle it.
    return this.#classes.knownPostConstruct(binding.target) !== false;
  }

  #nonClassNeedsActivation<Value>(binding: Binding<Value>): boolean {
    return this.#lifecycle.hasActivationHandlers(binding.token);
  }
}
