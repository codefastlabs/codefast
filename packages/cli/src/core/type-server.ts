/** Loads the native TypeScript type server, and the syntax tree it serves, for the type-aware commands. */

import type * as TypeServerSyntax from "typescript/unstable/ast";
import type * as TypeServer from "typescript/unstable/sync";

import { AppError, messageFrom } from "#core/errors";

async function loadOptionalPeer<Module>(purpose: string, load: () => Promise<Module>): Promise<Module> {
  try {
    return await load();
  } catch (cause) {
    throw new AppError(
      "INFRA_FAILURE",
      `${purpose} needs the "typescript" package (v7) resolvable from the target: ${messageFrom(cause)}`,
      cause,
    );
  }
}

/**
 * Loads the native TypeScript type-server API on demand, since `typescript` is an optional peer.
 *
 * @param purpose - The command or flag that needs the type server, named in the error when it is missing.
 * @throws AppError when the `typescript` package providing the type server cannot be loaded.
 *
 * @since 0.15.0
 */
export async function loadTypeServer(purpose: string): Promise<typeof TypeServer> {
  return loadOptionalPeer(purpose, () => import("typescript/unstable/sync"));
}

/**
 * Loads the syntax-tree helpers for the nodes the type server returns, on the same optional peer.
 *
 * @param purpose - The command or flag that needs the helpers, named in the error when they are missing.
 * @throws AppError when the `typescript` package providing them cannot be loaded.
 *
 * @since 0.15.0
 */
export async function loadTypeServerSyntax(purpose: string): Promise<typeof TypeServerSyntax> {
  return loadOptionalPeer(purpose, () => import("typescript/unstable/ast"));
}
