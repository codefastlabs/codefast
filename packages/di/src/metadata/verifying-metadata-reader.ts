/**
 * Wraps a foreign {@link MetadataReader} so its answers are verified before anything dereferences
 * them, and asked for once per class.
 */

import type { Constructor } from "#core/types";
import type { MetadataReader } from "#metadata/metadata-types";
import { defaultMetadataReader } from "#metadata/symbol-metadata-reader";
import {
  verifyAccessorMetadata,
  verifyConstructorMetadata,
  verifyLifecycleMetadata,
} from "#resolution/cache/class-introspector";

// Wrapping a wrapper would stack a layer per child container, so each one is remembered.
const verifyingReaders = new WeakSet<MetadataReader>();

// One wrapper per foreign reader, so every container handed that reader shares its answers.
const wrapperByReader = new WeakMap<MetadataReader, MetadataReader>();

// `null` records a verified "no metadata", so an absent answer is not asked for again either.
function memoized<Answer>(
  ask: (target: Constructor) => Answer | undefined,
): (target: Constructor) => Answer | undefined {
  const answers = new WeakMap<Constructor, Answer | null>();
  return (target) => {
    const known = answers.get(target);
    if (known !== undefined) {
      return known === null ? undefined : known;
    }
    // Stored only after `ask` returns, so an answer that fails verification is asked for, and fails, again.
    const answer = ask(target);
    answers.set(target, answer ?? null);
    return answer;
  };
}

/**
 * The reader a container should hand its resolver: verified and memoized when it came from outside.
 *
 * @remarks The decorator reader writes the metadata it later reads, so there is nothing to check and
 * nothing to pay — a container that supplies no reader of its own is left on the same code path it
 * has always taken. A supplied reader is a claim, and only its callers can be charged for checking;
 * it is asked about a class once, however many containers read through it.
 *
 * @since 0.6.0
 */
export function verifyingMetadataReader(reader: MetadataReader): MetadataReader {
  if (reader === defaultMetadataReader || verifyingReaders.has(reader)) {
    return reader;
  }
  const existing = wrapperByReader.get(reader);
  if (existing !== undefined) {
    return existing;
  }
  const verifying: MetadataReader = {
    getConstructorMetadata: memoized((target) => verifyConstructorMetadata(reader, target)),
    getLifecycleMetadata: memoized((target) => verifyLifecycleMetadata(reader, target)),
    ...(reader.getAccessorMetadata === undefined
      ? {}
      : { getAccessorMetadata: memoized((target) => verifyAccessorMetadata(reader, target)) }),
  };

  verifyingReaders.add(verifying);
  wrapperByReader.set(reader, verifying);

  return verifying;
}
