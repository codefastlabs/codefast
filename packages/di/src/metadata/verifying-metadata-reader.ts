/**
 * Wraps a foreign {@link MetadataReader} so its answers are verified before anything dereferences
 * them.
 */

import type { MetadataReader } from "#/metadata/metadata-types";
import { defaultMetadataReader } from "#/metadata/symbol-metadata-reader";
import { verifyConstructorMetadata } from "#/resolution/class-introspector";

// Wrapping a wrapper would stack a layer per child container, so each one is remembered.
const verifyingReaders = new WeakSet<MetadataReader>();

/**
 * The reader a container should hand its resolver: verified when it came from outside.
 *
 * @remarks The decorator reader writes the metadata it later reads, so there is nothing to check and
 * nothing to pay — a container that supplies no reader of its own is left on the same code path it
 * has always taken. A supplied reader is a claim, and only its callers can be charged for checking.
 */
export function verifyingMetadataReader(reader: MetadataReader): MetadataReader {
  if (reader === defaultMetadataReader || verifyingReaders.has(reader)) {
    return reader;
  }
  const readAccessors = reader.getAccessorMetadata?.bind(reader);
  const verifying: MetadataReader = {
    getConstructorMetadata: (target) => verifyConstructorMetadata(reader, target),
    getLifecycleMetadata: (target) => reader.getLifecycleMetadata(target),
    ...(readAccessors === undefined ? {} : { getAccessorMetadata: readAccessors }),
  };

  verifyingReaders.add(verifying);

  return verifying;
}
