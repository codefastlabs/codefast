/**
 * Per-class decorator metadata, cached by constructor.
 *
 * @remarks Metadata cannot change once a class is defined, so nothing here needs version stamping.
 */

import { runWithContainer } from "#/ambient/active-container";
import type { Container } from "#/container/container";
import type { ConstructorInvocation } from "#/core/constructor-type";
import type { Constructor } from "#/core/types";
import { InvalidMetadataError } from "#/errors/errors";
import type { ConstructorMetadata, MetadataReader } from "#/metadata/metadata-types";

// Verified pairs, not verified classes: two readers may disagree about the same class, and a reader
// that goes out of scope takes its record with it.
const verifiedTargets = new WeakMap<MetadataReader, WeakSet<Constructor>>();

/**
 * A reader's constructor metadata for a class, verified the first time this process asks.
 *
 * @remarks Metadata cannot change once a class is defined, so re-checking per container would charge
 * every fresh container for a fact already established — a per-request child or a cold boot pays
 * that repeatedly.
 */
export function verifyConstructorMetadata(
  reader: MetadataReader,
  target: Constructor,
): ConstructorMetadata | undefined {
  const metadata = reader.getConstructorMetadata(target);
  if (metadata === undefined) {
    return undefined;
  }
  let verified = verifiedTargets.get(reader);
  if (verified !== undefined && verified.has(target)) {
    return metadata;
  }
  assertConstructorMetadata(metadata, target);
  if (verified === undefined) {
    verified = new WeakSet();
    verifiedTargets.set(reader, verified);
  }
  verified.add(target);

  return metadata;
}

/**
 * Verifies what a reader claims about a class, since a `MetadataReader` is a public seam.
 *
 * @remarks Every path that reads constructor metadata comes through here, so a reader that answers
 * wrongly is a named error at the class it described rather than a `TypeError` raised later inside a
 * resolve. Only what a consumer dereferences is checked: `params` and each entry's `token`.
 * `optional`/`multi` degrade to falsy without crashing, and `index` is decorative — dependencies are
 * consumed positionally.
 */
export function assertConstructorMetadata(metadata: unknown, target: Constructor): ConstructorMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }
  if (typeof metadata !== "object" || metadata === null) {
    throw new InvalidMetadataError(target.name, `expected an object, received ${typeof metadata}`);
  }
  const params: unknown = Reflect.get(metadata, "params");
  if (!Array.isArray(params)) {
    throw new InvalidMetadataError(target.name, "params is not an array");
  }
  for (const [position, param] of params.entries()) {
    if (typeof param !== "object" || param === null) {
      throw new InvalidMetadataError(target.name, `params[${String(position)}] is not an object`);
    }
    const dependency: unknown = Reflect.get(param, "token");
    if (typeof dependency !== "object" && typeof dependency !== "function") {
      throw new InvalidMetadataError(target.name, `params[${String(position)}].token is not a token or a class`);
    }
  }

  return metadata as ConstructorMetadata;
}

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
