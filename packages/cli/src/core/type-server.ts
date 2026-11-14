/** Loads the native TypeScript type server, and the syntax tree it serves, for the type-aware commands. */

import type * as TypeServerSyntax from "typescript/unstable/ast";
import type * as TypeServer from "typescript/unstable/sync";

import { AppError, messageFrom } from "#core/errors";
import type { Result } from "#core/result";
import { err, ok } from "#core/result";

async function loadOptionalPeer<Module>(
  purpose: string,
  load: () => Promise<Module>,
): Promise<Result<Module, AppError>> {
  try {
    return ok(await load());
  } catch (cause) {
    return err(
      new AppError(
        "INFRA_FAILURE",
        `${purpose} needs the "typescript" package (v7) resolvable from the target: ${messageFrom(cause)}`,
        cause,
      ),
    );
  }
}

/**
 * Loads the native TypeScript type-server API on demand, since `typescript` is an optional peer.
 *
 * @param purpose - The command or flag that needs the type server, named in the error when it is missing.
 *
 * @since 0.15.0
 */
export async function loadTypeServer(purpose: string): Promise<Result<typeof TypeServer, AppError>> {
  return loadOptionalPeer(purpose, () => import("typescript/unstable/sync"));
}

/**
 * Loads the syntax-tree helpers for the nodes the type server returns, on the same optional peer.
 *
 * @param purpose - The command or flag that needs the helpers, named in the error when they are missing.
 *
 * @since 0.15.0
 */
export async function loadTypeServerSyntax(purpose: string): Promise<Result<typeof TypeServerSyntax, AppError>> {
  return loadOptionalPeer(purpose, () => import("typescript/unstable/ast"));
}
