/**
 * Per-class decorator metadata, cached by constructor.
 *
 * @remarks Metadata cannot change once a class is defined, so nothing here needs version stamping.
 */

import type { ConstructorInvocation } from "#/constructor-type";
import type { Container } from "#/container/container";
import type { ConstructorMetadata, MetadataReader } from "#/metadata/metadata-types";
import { runWithContainer } from "#/resolution/environment";
import type { Constructor } from "#/types";

/**
 * @since 0.5.0-canary.8
 */
export class ClassIntrospector {
  // Unallocated until the container resolves its first class binding — a container bound entirely
  // to constants, factories or aliases never introspects one.
  #constructorMetadata: WeakMap<Constructor, ConstructorMetadata | null> | undefined;
  #hasPostConstruct: WeakMap<Constructor, boolean> | undefined;
  #needsActiveContainer: WeakMap<Constructor, boolean> | undefined;
  readonly #reader: MetadataReader;
  readonly #container: Container;

  constructor(reader: MetadataReader, container: Container) {
    this.#reader = reader;
    this.#container = container;
  }

  constructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    const cached = this.#constructorMetadata?.get(target);
    if (cached !== undefined) {
      return cached === null ? undefined : cached;
    }
    const metadata = this.#reader.getConstructorMetadata(target);
    (this.#constructorMetadata ??= new WeakMap()).set(target, metadata ?? null);
    return metadata;
  }

  /**
   * Whether the class has a `@postConstruct` hook, or `undefined` until {@link discoverPostConstruct}.
   *
   * @remarks Callers treat unknown as "assume it does", so the first activation settles it.
   */
  knownPostConstruct(target: Constructor): boolean | undefined {
    return this.#hasPostConstruct?.get(target);
  }

  discoverPostConstruct(target: Constructor): void {
    const lifecycle = this.#reader.getLifecycleMetadata(target);
    (this.#hasPostConstruct ??= new WeakMap()).set(
      target,
      lifecycle !== undefined && lifecycle.postConstruct !== undefined && lifecycle.postConstruct.length > 0,
    );
  }

  /** True when the class has accessor injection, which reads the container during construction. */
  needsActiveContainer(target: Constructor): boolean {
    let needsActiveContainer = this.#needsActiveContainer?.get(target);
    if (needsActiveContainer === undefined) {
      needsActiveContainer = (this.#reader.getAccessorMetadata?.(target)?.length ?? 0) > 0;
      (this.#needsActiveContainer ??= new WeakMap()).set(target, needsActiveContainer);
    }
    return needsActiveContainer;
  }

  instantiate(target: Constructor, deps: Array<unknown>): unknown {
    const invokable = target as ConstructorInvocation;
    if (!this.needsActiveContainer(target)) {
      return new invokable(...deps);
    }
    return runWithContainer(this.#container, () => new invokable(...deps));
  }
}
