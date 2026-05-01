import type {
  TagResolvedTarget,
  TagTargetExecutionResult,
} from "#/domains/tag/domain/types.domain";

type TagProgressEvent =
  | { type: "target-started"; target: TagResolvedTarget }
  | { type: "target-completed"; target: TagResolvedTarget; result: TagTargetExecutionResult };

export function formatProgress(event: TagProgressEvent): string {
  function targetDisplayName(target: TagResolvedTarget): string {
    return target.packageName ?? target.rootRelativeTargetPath;
  }

  if (event.type === "target-started") {
    return `[tag] Processing ${targetDisplayName(event.target)}...`;
  }
  const changedFiles = event.result.result?.filesChanged ?? 0;
  return `[tag] Done ${targetDisplayName(event.target)} (${changedFiles} changes)`;
}
