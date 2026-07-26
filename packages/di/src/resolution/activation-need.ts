/**
 * Answers one question per binding: does resolving it have to go through the activation
 * pipeline (per-binding `onActivation`, container-level hooks, `@postConstruct`)?
 *
 * Worth caching because the answer costs several lookups and the resolver asks on every
 * uncached resolve, and worth versioning because `onActivation` can be registered at any time —
 * the whole cache drops whenever the lifecycle manager's activation version moves.
 */
import type { Binding } from "#/binding";
import type { ClassIntrospector } from "#/resolution/class-introspector";
import type { LifecycleManager } from "#/resolution/lifecycle";
import type { BindingIdentifier } from "#/types";

/**
 * @since 0.5.0-canary.7
 */
export class ActivationNeedCache {
  readonly #needByBindingId = new Map<BindingIdentifier, boolean>();
  #version = -1;
  readonly #lifecycle: LifecycleManager;
  readonly #classes: ClassIntrospector;

  constructor(lifecycle: LifecycleManager, classes: ClassIntrospector) {
    this.#lifecycle = lifecycle;
    this.#classes = classes;
  }

  needsActivation<const Value>(binding: Binding<Value>): boolean {
    const lifecycleVersion = this.#lifecycle.activationVersion;
    // No hooks registered anywhere and none on the binding: only classes can still surprise us,
    // via a @postConstruct we have not looked for yet.
    if (
      lifecycleVersion === 0 &&
      binding.kind !== "class" &&
      binding.kind !== "alias" &&
      binding.onActivation === undefined
    ) {
      return false;
    }
    if (this.#version !== lifecycleVersion) {
      this.#needByBindingId.clear();
      this.#version = lifecycleVersion;
    }
    const cached = this.#needByBindingId.get(binding.id);
    if (cached !== undefined) {
      return cached;
    }
    const needsActivation =
      binding.kind === "class" ? this.#classNeedsActivation(binding) : this.#nonClassNeedsActivation(binding);
    this.#needByBindingId.set(binding.id, needsActivation);
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
    if (binding.kind !== "class" || this.#classes.knownPostConstruct(binding.target) !== undefined) {
      return needsActivation;
    }
    this.#classes.discoverPostConstruct(binding.target);
    this.#needByBindingId.delete(binding.id);
    return this.needsActivation(binding);
  }

  #classNeedsActivation<const Value>(binding: Binding<Value> & { kind: "class" }): boolean {
    if (this.#lifecycle.hasActivationHandlers(binding.token) || binding.onActivation !== undefined) {
      return true;
    }
    // Unknown lifecycle metadata: activate once so the first instantiation can settle it.
    return this.#classes.knownPostConstruct(binding.target) !== false;
  }

  #nonClassNeedsActivation<const Value>(binding: Binding<Value>): boolean {
    if (binding.kind !== "alias" && binding.onActivation !== undefined) {
      return true;
    }
    return this.#lifecycle.hasActivationHandlers(binding.token);
  }
}
