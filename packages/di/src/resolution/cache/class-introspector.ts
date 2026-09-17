/**
 * Per-class decorator metadata, cached by constructor.
 *
 * @remarks Metadata cannot change once a class is defined, so nothing here needs version stamping.
 */

import { constructWithAmbientResolution, runWithAmbientResolution } from "#/ambient/active-container";
import type { AmbientResolution } from "#/ambient/active-container";
import type { Container } from "#/container/container";
import type { ConstructorInvocation } from "#/core/constructor-type";
import type { Constructor } from "#/core/types";
import { InvalidMetadataError } from "#/errors/errors";
import type { InjectionDescriptor } from "#/injection/descriptor";
import type { ConstructorMetadata, LifecycleMetadata, MetadataReader } from "#/metadata/metadata-types";

// Verified pairs, not verified classes: two readers may disagree about the same class, and a reader
// that goes out of scope takes its record with it.
const verifiedTargets = new WeakMap<MetadataReader, WeakSet<Constructor>>();
const verifiedLifecycleTargets = new WeakMap<MetadataReader, WeakSet<Constructor>>();
const verifiedAccessorTargets = new WeakMap<MetadataReader, WeakSet<Constructor>>();

function isVerified(
  cache: WeakMap<MetadataReader, WeakSet<Constructor>>,
  reader: MetadataReader,
  target: Constructor,
): boolean {
  return cache.get(reader)?.has(target) ?? false;
}

function markVerified(
  cache: WeakMap<MetadataReader, WeakSet<Constructor>>,
  reader: MetadataReader,
  target: Constructor,
): void {
  let verified = cache.get(reader);
  if (verified === undefined) {
    verified = new WeakSet();
    cache.set(reader, verified);
  }
  verified.add(target);
}

/**
 * Runs `validate` against a reader's metadata the first time this process sees the pair, then remembers it.
 *
 * @remarks An absent metadata answer needs no check; a verified pair is returned untouched, so the
 * shape assertion runs once per `(reader, target)` rather than per container.
 */
function verifyOnce<Metadata>(
  cache: WeakMap<MetadataReader, WeakSet<Constructor>>,
  reader: MetadataReader,
  target: Constructor,
  metadata: Metadata | undefined,
  validate: (metadata: Metadata) => void,
): Metadata | undefined {
  if (metadata === undefined || isVerified(cache, reader, target)) {
    return metadata;
  }
  validate(metadata);
  markVerified(cache, reader, target);
  return metadata;
}

/**
 * A reader's constructor metadata for a class, verified the first time this process asks.
 *
 * @remarks Metadata cannot change once a class is defined, so re-checking per container would charge
 * every fresh container for a fact already established — a per-request child or a cold boot pays
 * that repeatedly.
 *
 * @since 0.6.0
 */
export function verifyConstructorMetadata(
  reader: MetadataReader,
  target: Constructor,
): ConstructorMetadata | undefined {
  return verifyOnce(verifiedTargets, reader, target, reader.getConstructorMetadata(target), (metadata) => {
    assertConstructorMetadata(metadata, target);
  });
}

/**
 * Verifies what a reader claims about a class, since a `MetadataReader` is a public seam.
 *
 * @remarks Every path that reads constructor metadata comes through here, so a reader that answers
 * wrongly is a named error at the class it described rather than a `TypeError` raised later inside a
 * resolve. Only what a consumer dereferences is checked: `params` and each entry's `token`.
 * `optional`/`multi` degrade to falsy without crashing, and `index` is decorative — dependencies are
 * consumed positionally.
 *
 * @since 0.6.0
 */
export function assertConstructorMetadata(metadata: unknown, target: Constructor): ConstructorMetadata | undefined {
  if (metadata === undefined) {
    return undefined;
  }
  if (typeof metadata !== "object" || metadata === null) {
    throw new InvalidMetadataError(
      target.name,
      `constructor metadata: expected an object, received ${typeof metadata}`,
    );
  }
  const params: unknown = Reflect.get(metadata, "params");
  if (!Array.isArray(params)) {
    throw new InvalidMetadataError(target.name, "constructor metadata: params is not an array");
  }
  for (const [position, param] of params.entries()) {
    if (typeof param !== "object" || param === null) {
      throw new InvalidMetadataError(target.name, `constructor metadata: params[${String(position)}] is not an object`);
    }
    const dependency: unknown = Reflect.get(param, "token");
    if (typeof dependency !== "object" && typeof dependency !== "function") {
      throw new InvalidMetadataError(
        target.name,
        `constructor metadata: params[${String(position)}].token is not a token or a class`,
      );
    }
  }

  return metadata as ConstructorMetadata;
}

/**
 * A reader's lifecycle metadata for a class, verified the first time this process asks.
 *
 * @since 0.6.0
 */
export function verifyLifecycleMetadata(reader: MetadataReader, target: Constructor): LifecycleMetadata | undefined {
  return verifyOnce(verifiedLifecycleTargets, reader, target, reader.getLifecycleMetadata(target), (metadata) => {
    if (typeof metadata !== "object" || metadata === null) {
      throw new InvalidMetadataError(
        target.name,
        `lifecycle metadata: expected an object, received ${typeof metadata}`,
      );
    }
    for (const phase of ["postConstruct", "preDestroy"] as const) {
      const methods: unknown = Reflect.get(metadata, phase);
      if (methods === undefined) {
        continue;
      }
      if (!Array.isArray(methods)) {
        throw new InvalidMetadataError(target.name, `lifecycle metadata: ${phase} is not an array`);
      }
      for (const [position, name] of methods.entries()) {
        if (typeof name !== "string") {
          throw new InvalidMetadataError(
            target.name,
            `lifecycle metadata: ${phase}[${String(position)}] is not a string`,
          );
        }
      }
    }
  });
}

/**
 * A reader's accessor metadata for a class, verified the first time this process asks.
 *
 * @since 0.6.0
 */
export function verifyAccessorMetadata(
  reader: MetadataReader,
  target: Constructor,
): ReadonlyArray<{ readonly key: string | symbol; readonly descriptor: InjectionDescriptor }> | undefined {
  return verifyOnce(verifiedAccessorTargets, reader, target, reader.getAccessorMetadata?.(target), (metadata) => {
    if (!Array.isArray(metadata)) {
      throw new InvalidMetadataError(target.name, "accessor metadata: expected an array");
    }
    for (const [position, entry] of metadata.entries()) {
      if (typeof entry !== "object" || entry === null) {
        throw new InvalidMetadataError(target.name, `accessor metadata: [${String(position)}] is not an object`);
      }
      const key: unknown = Reflect.get(entry, "key");
      if (typeof key !== "string" && typeof key !== "symbol") {
        throw new InvalidMetadataError(
          target.name,
          `accessor metadata: [${String(position)}].key is not a string or symbol`,
        );
      }
      const descriptor: unknown = Reflect.get(entry, "descriptor");
      if (typeof descriptor !== "object" || descriptor === null) {
        throw new InvalidMetadataError(
          target.name,
          `accessor metadata: [${String(position)}].descriptor is not an object`,
        );
      }
      const dependency: unknown = Reflect.get(descriptor, "token");
      if (typeof dependency !== "object" && typeof dependency !== "function") {
        throw new InvalidMetadataError(
          target.name,
          `accessor metadata: [${String(position)}].descriptor.token is not a token or a class`,
        );
      }
    }
  });
}

/**
 * The per-class facts one reader yields, shared by every container that reads through that reader.
 *
 * @remarks A reader answers from the class alone, so a child inheriting its parent's reader takes its
 * answers too and resolves a class the parent already met without reading its metadata again. A root
 * finds them by reader on its first question; each map waits for a class of its kind.
 */
interface MetadataCaches {
  constructorMetadata: WeakMap<Constructor, ConstructorMetadata | null> | undefined;
  hasPostConstruct: WeakMap<Constructor, boolean> | undefined;
  needsActiveContainer: WeakMap<Constructor, boolean> | undefined;
}

const cachesByReader = new WeakMap<MetadataReader, MetadataCaches>();

function cachesFor(reader: MetadataReader): MetadataCaches {
  let caches = cachesByReader.get(reader);
  if (caches === undefined) {
    caches = { constructorMetadata: undefined, hasPostConstruct: undefined, needsActiveContainer: undefined };
    cachesByReader.set(reader, caches);
  }
  return caches;
}

/**
 * A per-class cache of constructor metadata and the activation facts derived from it.
 *
 * @since 0.5.0-canary.8
 */
export class ClassIntrospector {
  #caches: MetadataCaches | undefined;
  readonly #reader: MetadataReader;
  readonly #container: Container;

  constructor(reader: MetadataReader, container: Container, inherited: ClassIntrospector | undefined) {
    this.#caches = inherited !== undefined && inherited.#reader === reader ? inherited.#caches : undefined;
    this.#reader = reader;
    this.#container = container;
  }

  #shared(): MetadataCaches {
    return (this.#caches ??= cachesFor(this.#reader));
  }

  constructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    const caches = this.#shared();
    const cached = caches.constructorMetadata?.get(target);
    if (cached !== undefined) {
      return cached === null ? undefined : cached;
    }
    const metadata = this.#reader.getConstructorMetadata(target);
    (caches.constructorMetadata ??= new WeakMap<Constructor, ConstructorMetadata | null>()).set(
      target,
      metadata ?? null,
    );
    return metadata;
  }

  /**
   * Whether the class has a `@postConstruct` hook, or `undefined` until {@link discoverPostConstruct}.
   *
   * @remarks Callers treat unknown as "assume it does", so the first activation settles it.
   */
  knownPostConstruct(target: Constructor): boolean | undefined {
    return this.#shared().hasPostConstruct?.get(target);
  }

  discoverPostConstruct(target: Constructor): void {
    const lifecycle = this.#reader.getLifecycleMetadata(target);
    (this.#shared().hasPostConstruct ??= new WeakMap<Constructor, boolean>()).set(
      target,
      lifecycle !== undefined && lifecycle.postConstruct !== undefined && lifecycle.postConstruct.length > 0,
    );
  }

  /** True when the class has accessor injection, which reads the container during construction. */
  needsActiveContainer(target: Constructor): boolean {
    const caches = this.#shared();
    let needsActiveContainer = caches.needsActiveContainer?.get(target);
    if (needsActiveContainer === undefined) {
      needsActiveContainer = (this.#reader.getAccessorMetadata?.(target)?.length ?? 0) > 0;
      (caches.needsActiveContainer ??= new WeakMap<Constructor, boolean>()).set(target, needsActiveContainer);
    }
    return needsActiveContainer;
  }

  instantiate(target: Constructor, deps: Array<unknown>, resolution?: AmbientResolution): unknown {
    const invokable = target as ConstructorInvocation;
    if (!this.needsActiveContainer(target)) {
      return new invokable(...deps);
    }
    if (resolution === undefined) {
      return runWithAmbientResolution(this.#container, undefined, () => new invokable(...deps));
    }
    return constructWithAmbientResolution(this.#container, resolution, invokable, deps);
  }
}
