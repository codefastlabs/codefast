/**
 * Wraps a foreign {@link MetadataReader} so its answers are verified before anything dereferences
 * them, and asked for once per class.
 */

import type { Constructor } from "#core/types";
import type { MetadataReader } from "#metadata/types";
import type { VerifiedMetadataReader } from "#metadata/verified-reader";
import { isVerifiedReader, markVerifiedReader } from "#metadata/verified-reader";
import { verifyAccessorMetadata, verifyConstructorMetadata, verifyLifecycleMetadata } from "#metadata/verify";

// One wrapper per foreign reader, so every container handed that reader shares its answers.
const wrapperByReader = new WeakMap<MetadataReader, VerifiedMetadataReader>();

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
 * Creates the verified form of a custom reader: its answers checked before the engine reads them, and memoized.
 *
 * @remarks A container accepts only a verified reader, so a custom one passes through here first, in
 * `ContainerOptions.metadataReader` or bound to `MetadataReaderToken`. The checks ship only in a program
 * that calls this. The decorator reader, and a reader this already returned, come back as they are.
 *
 * @since 0.6.0
 */
export function verifyingMetadataReader(reader: MetadataReader): VerifiedMetadataReader {
  if (isVerifiedReader(reader)) {
    return reader;
  }
  const existing = wrapperByReader.get(reader);
  if (existing !== undefined) {
    return existing;
  }
  const verifying = markVerifiedReader<MetadataReader>({
    getConstructorMetadata: memoized((target) => verifyConstructorMetadata(reader, target)),
    getLifecycleMetadata: memoized((target) => verifyLifecycleMetadata(reader, target)),
    ...(reader.getAccessorMetadata === undefined
      ? {}
      : { getAccessorMetadata: memoized((target) => verifyAccessorMetadata(reader, target)) }),
  });

  wrapperByReader.set(reader, verifying);

  return verifying;
}
