/** The mark a metadata reader carries once the engine may trust its answers, and the check that reads it. */
import type { MetadataReader } from "#metadata/types";

declare const verifiedBrand: unique symbol;

/**
 * A metadata reader whose answers the engine may read without checking them again.
 *
 * @remarks The decorator reader is one by construction; a custom reader becomes one through
 * `verifyingMetadataReader`, so only a program that brings its own reader carries the checks.
 *
 * @since 0.14.0
 */
export type VerifiedMetadataReader = MetadataReader & { readonly [verifiedBrand]: true };

const verifiedReaders = new WeakSet<MetadataReader>();

/**
 * Marks a reader as verified and returns it under the branded type.
 *
 * @since 0.14.0
 */
export function markVerifiedReader<Reader extends MetadataReader>(reader: Reader): Reader & VerifiedMetadataReader {
  verifiedReaders.add(reader);
  return reader as Reader & VerifiedMetadataReader;
}

/**
 * Whether a reader is verified: the decorator reader, or one `verifyingMetadataReader` returned.
 *
 * @since 0.14.0
 */
export function isVerifiedReader(reader: MetadataReader): reader is VerifiedMetadataReader {
  return verifiedReaders.has(reader);
}

/**
 * Returns the reader when it is verified, and throws when it is not.
 *
 * @throws TypeError when a custom reader reaches a container without passing through `verifyingMetadataReader`.
 *
 * @since 0.14.0
 */
export function requireVerifiedReader(reader: MetadataReader): VerifiedMetadataReader {
  if (!isVerifiedReader(reader)) {
    throw new TypeError(
      "A custom MetadataReader must be wrapped with verifyingMetadataReader() before a container uses it.",
    );
  }
  return reader;
}
