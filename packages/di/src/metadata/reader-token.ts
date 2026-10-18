import { token } from "#core/token";
import type { Token } from "#core/token";
import type { VerifiedMetadataReader } from "#metadata/verified-reader";

/**
 * The token a custom `MetadataReader` is bound to for a container to pick up.
 *
 * @remarks The value bound is a verified reader, the one `verifyingMetadataReader` returns.
 *
 * @since 0.3.16-canary.0
 */
export const MetadataReaderToken: Token<VerifiedMetadataReader> = token<VerifiedMetadataReader>("di:MetadataReader");
