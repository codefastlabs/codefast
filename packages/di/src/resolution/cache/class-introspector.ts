/**
 * Per-class decorator metadata, cached by constructor.
 *
 * @remarks Metadata cannot change once a class is defined, so nothing here needs version stamping.
 */

import { constructWithAmbientResolution, runWithAmbientResolution } from "#ambient/active-container";
import type { AmbientResolution } from "#ambient/active-container";
import type { Container } from "#container/container";
import type { ConstructorInvocation } from "#core/constructor-type";
import type { Constructor } from "#core/types";
import { InvalidMetadataError } from "#errors/errors";
import type { InjectionDescriptor } from "#injection/descriptor";
import type { ConstructorMetadata, LifecycleMetadata, MetadataReader } from "#metadata/metadata-types";

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
 * What one reader has answered about one class so far, each field unknown until first asked.
 *
 * @remarks One record per class, so a cold resolve looks the class up once and hands the record down
 * rather than asking a map per fact.
 */
export interface ClassFacts {
  /** The reader's constructor metadata, `null` once it answered that it knows nothing about the class. */
  constructorMetadata: ConstructorMetadata | null | undefined;
  /** Unknown until the first instantiation reads lifecycle metadata; callers read unknown as "it does". */
  hasPostConstruct: boolean | undefined;
  needsActiveContainer: boolean | undefined;
}

// A reader answers from the class alone, so its facts are shared by every container reading through it.
const factsByReader = new WeakMap<MetadataReader, WeakMap<Constructor, ClassFacts>>();

function factsFor(reader: MetadataReader): WeakMap<Constructor, ClassFacts> {
  let byClass = factsByReader.get(reader);
  if (byClass === undefined) {
    byClass = new WeakMap<Constructor, ClassFacts>();
    factsByReader.set(reader, byClass);
  }
  return byClass;
}

/**
 * A per-class cache of constructor metadata and the activation facts derived from it.
 *
 * @remarks A child inheriting its parent's reader takes the parent's facts too, and resolves a class
 * the parent already met without reading its metadata again; a root finds them by reader on its first
 * question.
 *
 * @since 0.5.0-canary.8
 */
export class ClassIntrospector {
  #byClass: WeakMap<Constructor, ClassFacts> | undefined;
  readonly #reader: MetadataReader;
  readonly #container: Container;

  constructor(reader: MetadataReader, container: Container, inherited: ClassIntrospector | undefined) {
    this.#byClass = inherited !== undefined && inherited.#reader === reader ? inherited.#byClass : undefined;
    this.#reader = reader;
    this.#container = container;
  }

  /** The record of what this reader has answered about a class, allocated on the class's first question. */
  facts(target: Constructor): ClassFacts {
    const byClass = (this.#byClass ??= factsFor(this.#reader));
    let facts = byClass.get(target);
    if (facts === undefined) {
      facts = { constructorMetadata: undefined, hasPostConstruct: undefined, needsActiveContainer: undefined };
      byClass.set(target, facts);
    }
    return facts;
  }

  constructorMetadata(target: Constructor): ConstructorMetadata | undefined {
    return this.constructorMetadataOf(target, this.facts(target));
  }

  /** The constructor metadata of a class whose facts the caller already holds. */
  constructorMetadataOf(target: Constructor, facts: ClassFacts): ConstructorMetadata | undefined {
    let metadata = facts.constructorMetadata;
    if (metadata === undefined) {
      metadata = this.#reader.getConstructorMetadata(target) ?? null;
      facts.constructorMetadata = metadata;
    }
    return metadata === null ? undefined : metadata;
  }

  /**
   * The nearest ancestor's own constructor metadata, for a subclass that declares none of its own.
   *
   * @remarks Constructor metadata is never borrowed down the chain, so a subclass with an implicit
   * constructor would be built with zero arguments; this lets the resolver name the base whose
   * declared deps the subclass silently drops.
   */
  inheritedConstructorMetadata(target: Constructor): { base: Constructor; metadata: ConstructorMetadata } | undefined {
    let current: unknown = Object.getPrototypeOf(target);
    while (typeof current === "function" && current !== Function.prototype) {
      const metadata = this.constructorMetadata(current as Constructor);
      if (metadata !== undefined) {
        return { base: current as Constructor, metadata };
      }
      current = Object.getPrototypeOf(current);
    }
    return undefined;
  }

  /**
   * Whether the class has a `@postConstruct` hook, or `undefined` until {@link discoverPostConstruct}.
   *
   * @remarks Callers treat unknown as "assume it does", so the first activation settles it.
   */
  knownPostConstruct(target: Constructor): boolean | undefined {
    return (this.#byClass ??= factsFor(this.#reader)).get(target)?.hasPostConstruct;
  }

  discoverPostConstruct(target: Constructor): void {
    const lifecycle = this.#reader.getLifecycleMetadata(target);
    this.facts(target).hasPostConstruct =
      lifecycle !== undefined && lifecycle.postConstruct !== undefined && lifecycle.postConstruct.length > 0;
  }

  /** True when the class has accessor injection, which reads the container during construction. */
  needsActiveContainer(target: Constructor): boolean {
    return this.needsActiveContainerOf(target, this.facts(target));
  }

  /** Whether a class whose facts the caller already holds reads the container during construction. */
  needsActiveContainerOf(target: Constructor, facts: ClassFacts): boolean {
    let needsActiveContainer = facts.needsActiveContainer;
    if (needsActiveContainer === undefined) {
      needsActiveContainer = (this.#reader.getAccessorMetadata?.(target)?.length ?? 0) > 0;
      facts.needsActiveContainer = needsActiveContainer;
    }
    return needsActiveContainer;
  }

  instantiate(target: Constructor, deps: Array<unknown>, resolution?: AmbientResolution): unknown {
    return this.construct(target, deps, this.needsActiveContainer(target), resolution);
  }

  /** Builds an instance whose accessor need the caller already knows; an empty `deps` is a call with no arguments. */
  construct(
    target: Constructor,
    deps: ReadonlyArray<unknown>,
    needsActiveContainer: boolean,
    resolution: AmbientResolution | undefined,
  ): unknown {
    const invokable = target as ConstructorInvocation;
    if (!needsActiveContainer) {
      return deps.length === 0 ? new invokable() : new invokable(...deps);
    }
    if (resolution === undefined) {
      return runWithAmbientResolution(this.#container, undefined, () => new invokable(...deps));
    }
    return constructWithAmbientResolution(this.#container, resolution, invokable, deps);
  }
}
