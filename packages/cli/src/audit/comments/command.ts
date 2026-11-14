import { runCommentAudit } from "#audit/comments/run";
import type { Audit } from "#audit/domain/types";

/**
 * The `audit:comments` audit: comments off the repo's conventions, whose divider forms `--fix` rewrites.
 */
export const commentsAudit: Audit = {
  name: "comments",
  configKey: "comments",
  description:
    "Report comment defects: off-form section dividers, banned content, invalid TSDoc, dangling links and impossible @since",
  scan: runCommentAudit,
};
