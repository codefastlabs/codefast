/** Whether any class in this process declares a lifecycle method, and the class an instance came from. */
import type { Binding } from "#/core/binding";
import type { Constructor } from "#/core/types";

let declarationCount = 0;

/** Called by the lifecycle decorators as classes are defined. */
export function noteLifecycleMethodDeclared(): void {
  declarationCount += 1;
}

/**
 * Whether a `@postConstruct` / `@preDestroy` has been declared anywhere in this process.
 *
 * @remarks A factory's instance can only be inspected once it exists, which is the hot path, so
 * resolution asks this first and a process that declares none pays one boolean for the whole
 * feature. Exact for the default reader, whose only source of lifecycle metadata is those
 * decorators; a custom reader answers from somewhere this cannot see.
 */
export function anyLifecycleMethodDeclared(): boolean {
  return declarationCount > 0;
}

/**
 * Monotonic count of declarations so far.
 *
 * @remarks A lazily imported class can declare one after a binding's answer was already memoized,
 * so memos fold this in and a late declaration evicts them.
 */
export function lifecycleDeclarationVersion(): number {
  return declarationCount;
}

/**
 * Whether resolving this binding builds an instance whose class only it knows.
 *
 * @remarks A factory names no class up front, so a `@postConstruct` on what it returns can only be
 * found by reading the instance. A class binding needs none of that — its target is known — and a
 * constant is excluded deliberately, since the caller built that instance rather than the container.
 */
export function producesOwnInstance(binding: Binding): boolean {
  const { kind } = binding;
  return kind === "dynamic" || kind === "dynamic-async" || kind === "resolved" || kind === "resolved-async";
}

/**
 * The class that produced an instance, or `undefined` when there is none to read.
 *
 * @remarks A factory declares nothing about what it returns, so its instance is the only place the
 * class can come from. Reads the own/inherited `constructor` rather than the prototype, so a
 * null-prototype object and a primitive both answer `undefined` instead of throwing.
 */
export function producingClassOf(instance: unknown): Constructor | undefined {
  if (instance === null || (typeof instance !== "object" && typeof instance !== "function")) {
    return undefined;
  }
  const produced: unknown = (instance as { constructor?: unknown }).constructor;
  return typeof produced === "function" ? (produced as Constructor) : undefined;
}
