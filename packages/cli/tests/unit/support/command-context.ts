import type { CommandContext } from "#core/command";
import type { Filesystem } from "#core/filesystem/filesystem";
import { resolveTarget } from "#core/target";
import { loadWorkspace } from "#core/workspace/workspace";

/**
 * Builds the context a command's run receives, the way the pipeline does, failing the test when it cannot.
 */
export async function createCommandContext<Flag extends string = never>(
  fs: Filesystem,
  options: {
    readonly cwd: string;
    readonly target?: string | undefined;
    readonly flags?: Readonly<Record<Flag, boolean>> | undefined;
  },
): Promise<CommandContext<Flag>> {
  const workspace = await loadWorkspace(fs, options.cwd);
  if (!workspace.ok) {
    throw new Error(workspace.error.message);
  }
  const target = resolveTarget(fs, {
    rootDir: workspace.value.rootDir,
    currentWorkingDirectory: options.cwd,
    given: options.target,
    configured: undefined,
  });
  if (!target.ok) {
    throw new Error(target.error.message);
  }
  return {
    fs,
    workspace: workspace.value,
    target: target.value,
    targetGiven: options.target !== undefined,
    currentWorkingDirectory: options.cwd,
    flags: options.flags ?? ({} as Readonly<Record<Flag, boolean>>),
    verbose: false,
  };
}
