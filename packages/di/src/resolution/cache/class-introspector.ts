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
import type { ConstructorMetadata, MetadataReader, ParamMetadata } from "#metadata/metadata-types";

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
  /** The parameters an instantiation injects, settled by the first one that succeeds. */
  params: ReadonlyArray<ParamMetadata> | undefined;
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
  // The class asked about last and its record: a cold resolve asks about one class several times in a row.
  #lastTarget: Constructor | undefined;
  #lastFacts: ClassFacts | undefined;
  readonly #reader: MetadataReader;
  readonly #container: Container;

  constructor(reader: MetadataReader, container: Container, inherited: ClassIntrospector | undefined) {
    this.#byClass = inherited !== undefined && inherited.#reader === reader ? inherited.#byClass : undefined;
    this.#reader = reader;
    this.#container = container;
  }

  /** The record of what this reader has answered about a class, allocated on the class's first question. */
  facts(target: Constructor): ClassFacts {
    if (target === this.#lastTarget) {
      return this.#lastFacts!;
    }
    const byClass = (this.#byClass ??= factsFor(this.#reader));
    let facts = byClass.get(target);
    if (facts === undefined) {
      facts = {
        constructorMetadata: undefined,
        hasPostConstruct: undefined,
        needsActiveContainer: undefined,
        params: undefined,
      };
      byClass.set(target, facts);
    }
    this.#lastTarget = target;
    this.#lastFacts = facts;
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
    return this.facts(target).hasPostConstruct;
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
