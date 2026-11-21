/** Upstream `tailwind-variants` as the shared scenarios drive it; the only module its subprocess loads a library from. */
import { cn, createTV, tv } from "tailwind-variants";

import type { TvLibrary, TvOptions } from "#lib/tv-library";

/**
 * The upstream library.
 *
 * @since 0.11.1
 */
export const tailwindVariants: TvLibrary = {
  cn: cn as TvLibrary["cn"],
  createTv: (options: TvOptions) => createTV(options),
  tv,
};
