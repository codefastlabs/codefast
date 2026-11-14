import path from "node:path";

import type { AuditContext } from "#audit/domain/types";
import { createCommandContext } from "#tests/unit/support/command-context";
import type { MemoryFilesystem } from "#tests/unit/support/memory-filesystem";
import { createMemoryFilesystem } from "#tests/unit/support/memory-filesystem";

/**
 * The root every audit test project sits at.
 */
export const auditRoot = path.resolve("/repo");

/**
 * Builds an in-memory single-package project at {@link auditRoot} and the context an audit runs with over it.
 */
export async function createAuditContext(
  files: Readonly<Record<string, string>>,
  options: { readonly target?: string; readonly fix?: boolean } = {},
): Promise<MemoryFilesystem & { readonly context: AuditContext }> {
  const memory = createMemoryFilesystem({
    [path.join(auditRoot, "package.json")]: '{"name":"repo","version":"1.0.0"}',
    ...Object.fromEntries(Object.entries(files).map(([file, content]) => [path.join(auditRoot, file), content])),
  });
  const context = await createCommandContext(memory.fs, {
    cwd: auditRoot,
    target: options.target,
    flags: { fix: options.fix ?? false },
  });
  return { ...memory, context };
}
