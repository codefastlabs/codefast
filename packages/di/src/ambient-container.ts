/** The container an `@inject` accessor initializer resolves from when it has no other handle. */
import type { Container } from "#container/container";
import type { ConstructorInvocation } from "#core/constructor-type";
import type { Token } from "#core/token";
import type { Constructor, ResolveOptions } from "#core/types";
import type { DependencySlot } from "#injection/dependency-slot";

/**
 * Path-continuing resolution the engine installs while constructing a class with `@inject` accessors.
 *
 * @remarks Resolving through this keeps an accessor's dependencies on the live resolution path, so a
 * cycle through an accessor surfaces as `CircularDependencyError` instead of unbounded recursion.
 *
 * @since 0.6.0
 */
export interface AmbientResolution {
  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value;
  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined;
  /**
   * The value a plan resolved for this accessor ahead of construction, or {@link NOT_PREPARED}.
   *
   * @remarks Absent on a resolution that prepares nothing, which leaves every accessor to resolve itself.
   */
  takePrepared?(instance: unknown, slot: DependencySlot): unknown;
}

// Slots whose initializer asks for a prepared value — an `@inject` accessor's own descriptor.
const preparableSlots = new WeakSet<DependencySlot>();

/**
 * Marks a slot whose accessor initializer takes a prepared value when one is offered.
 *
 * @since 0.14.0
 */
export function markPreparableSlot(slot: DependencySlot): void {
  preparableSlots.add(slot);
}

/**
 * Whether an initializer will ask for this slot's prepared value, so preparing it is never wasted.
 *
 * @since 0.14.0
 */
export function isPreparableSlot(slot: DependencySlot): boolean {
  return preparableSlots.has(slot);
}

/**
 * The answer {@link AmbientResolution.takePrepared} gives for an accessor it holds no value for.
 *
 * @since 0.14.0
 */
export const NOT_PREPARED: unique symbol = Symbol("di:not-prepared");

/**
 * Accessor values a compiled plan resolved before construction, handed to the initializers in order.
 *
 * @remarks An initializer takes the next value only when its slot is the next one prepared and it
 * initializes the instance that took the first, so a class constructed inside the constructor
 * resolves for itself instead of taking another instance's value.
 *
 * @since 0.14.0
 */
export class PreparedAccessorResolution implements AmbientResolution {
  readonly #fallback: AmbientResolution;
  readonly #slots: ReadonlyArray<DependencySlot>;
  readonly #values: ReadonlyArray<unknown>;
  #next = 0;
  #owner: unknown = undefined;

  /**
   * @param fallback - Resolves an accessor the plan did not prepare, with the class on the path.
   * @param slots - The accessors' slots, in the order their initializers run.
   * @param values - One resolved value per slot.
   */
  constructor(fallback: AmbientResolution, slots: ReadonlyArray<DependencySlot>, values: ReadonlyArray<unknown>) {
    this.#fallback = fallback;
    this.#slots = slots;
    this.#values = values;
  }

  resolve<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value {
    return this.#fallback.resolve(token, options);
  }

  resolveOptional<Value>(token: Token<Value> | Constructor<Value>, options?: ResolveOptions): Value | undefined {
    return this.#fallback.resolveOptional(token, options);
  }

  takePrepared(instance: unknown, slot: DependencySlot): unknown {
    const index = this.#next;
    if (this.#slots[index] !== slot) {
      return NOT_PREPARED;
    }
    if (index === 0) {
      this.#owner = instance;
    } else if (this.#owner !== instance) {
      return NOT_PREPARED;
    }
    this.#next = index + 1;
    return this.#values[index];
  }
}

let activeContainer: Container | undefined;
let activeResolution: AmbientResolution | undefined;

/**
 * Runs a synchronous callback with the given container installed as the ambient one and returns its result.
 *
 * @remarks The context lives in a module-level variable restored in a `finally`, so it lasts only the
 * synchronous run of `fn` — it does not survive an `await`. A callback returning a `Promise` is a
 * mistake the return type flags: it resolves to `never`, and the ambient context would already be torn
 * down by the time the promise settled.
 *
 * @since 0.3.16-canary.0
 */
export function runWithContainer<Result>(
  container: Container,
  fn: () => Result,
): Result extends Promise<unknown> ? never : Result {
  return runWithAmbientResolution(container, undefined, fn) as Result extends Promise<unknown> ? never : Result;
}

/**
 * Engine-internal variant of {@link runWithContainer} that also installs a path-continuing resolver.
 *
 * @since 0.6.0
 */
export function runWithAmbientResolution<Result>(
  container: Container,
  resolution: AmbientResolution | undefined,
  fn: () => Result,
): Result {
  const previousContainer = activeContainer;
  const previousResolution = activeResolution;
  activeContainer = container;
  activeResolution = resolution;
  try {
    return fn();
  } finally {
    activeContainer = previousContainer;
    activeResolution = previousResolution;
  }
}

/**
 * Constructs `target` with `container` and `resolution` ambient for the duration of its constructor.
 *
 * @remarks The construction is written out rather than wrapped in a closure: an accessor-injected
 * class pays this on every instantiation, and the closure was one of two allocations it paid for.
 *
 * @since 0.10.0
 */
export function constructWithAmbientResolution(
  container: Container,
  resolution: AmbientResolution,
  target: ConstructorInvocation,
  deps: ReadonlyArray<unknown>,
): unknown {
  const previousContainer = activeContainer;
  const previousResolution = activeResolution;
  activeContainer = container;
  activeResolution = resolution;
  try {
    // A spread call is not inlined, and most accessor classes take no constructor arguments.
    return deps.length === 0 ? new target() : new target(...deps);
  } finally {
    activeContainer = previousContainer;
    activeResolution = previousResolution;
  }
}

/**
 * Returns the ambient container for the construction in flight, if one is installed.
 *
 * @since 0.10.0
 */
export function getActiveContainer(): Container | undefined {
  return activeContainer;
}

/**
 * The path-continuing resolution for the construction in flight, when the engine installed one.
 *
 * @since 0.6.0
 */
export function getAmbientResolution(): AmbientResolution | undefined {
  return activeResolution;
}
