/**
 * Everything the resolver needs to know about a class, cached per class.
 *
 * All of it derives from decorator metadata, which cannot change once the class is defined, so
 * these caches are keyed by the constructor in a WeakMap and never need version stamping — the
 * one exception being post-construct presence, which is only *discovered* on the first real
 * instantiation (see {@link ClassIntrospector.knownPostConstruct}).
 */

import type { ConstructorInvocation } from "#/constructor-type";
import type { Container } from "#/container/container";
import type { ConstructorMetadata, MetadataReader } from "#/metadata/metadata-types";
import { runWithContainer } from "#/resolution/environment";
import type { Constructor } from "#/types";

/**
 * @since 0.5.0-canary.7
 */
export class ClassIntrospector {
  readonly #constructorMetadata = new WeakMap<Constructor, ConstructorMetadata | null>();
  readonly #hasPostConstruct = new WeakMap<Constructor, boolean>();
  readonly #needsActiveContainer = new WeakMap<Constructor, boolean>();
  readonly #reader: MetadataReader;
  readonly #container: Container;

  constructor(reader: MetadataReader, container: Container) {
    this.#reader = reader;
    this.#container = container;
  }

  constructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    const cached = this.#constructorMetadata.get(target);
    if (cached !== undefined) {
      return cached === null ? undefined : cached;
    }
    const metadata = this.#reader.getConstructorMetadata(target);
    this.#constructorMetadata.set(target, metadata ?? null);
    return metadata;
  }

  /**
   * Whether the class has a `@postConstruct` hook, or `undefined` when no resolve has looked yet.
   *
   * @remarks Reading lifecycle metadata eagerly would cost every class in the graph on first
   * resolve; instead the answer stays unknown until {@link discoverPostConstruct}, and callers
   * treat unknown as "assume it does" so the activation pipeline runs once and settles the
   * question. The compiled plans refuse to compile until it is known, then compile for real.
   */
  knownPostConstruct(target: Constructor): boolean | undefined {
    return this.#hasPostConstruct.get(target);
  }

  discoverPostConstruct(target: Constructor): void {
    const lifecycle = this.#reader.getLifecycleMetadata(target);
    this.#hasPostConstruct.set(
      target,
      lifecycle !== undefined && lifecycle.postConstruct !== undefined && lifecycle.postConstruct.length > 0,
    );
  }

  /** True when the class has accessor injection, which reads the container during construction. */
  needsActiveContainer(target: Constructor): boolean {
    let needsActiveContainer = this.#needsActiveContainer.get(target);
    if (needsActiveContainer === undefined) {
      needsActiveContainer = (this.#reader.getAccessorMetadata?.(target)?.length ?? 0) > 0;
      this.#needsActiveContainer.set(target, needsActiveContainer);
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
