import process from "node:process";

import { Command } from "commander";

import {
  commentAuditRunRequestSchema,
  linkAuditRunRequestSchema,
  reactAuditRunRequestSchema,
  rtlAuditRunRequestSchema,
  displayNameAuditRunRequestSchema,
} from "#/audit/cli-schema";
import {
  exitCodeForCommentAuditResult,
  exitCodeForLinkAuditResult,
  exitCodeForReactAuditResult,
  exitCodeForRtlAuditResult,
  exitCodeForDisplayNameAuditResult,
  formatCommentAuditJsonOutput,
  formatLinkAuditJsonOutput,
  formatReactAuditJsonOutput,
  formatRtlAuditJsonOutput,
  formatDisplayNameAuditJsonOutput,
  presentCommentAuditResult,
  presentLinkAuditResult,
  presentReactAuditResult,
  presentRtlAuditResult,
  presentDisplayNameAuditResult,
} from "#/audit/output";
import {
  prepareCommentAudit,
  prepareLinkAudit,
  prepareReactAudit,
  prepareRtlAudit,
  prepareDisplayNameAudit,
} from "#/audit/prepare";
import { runRtlAudit } from "#/audit/run";
import { runCommentAudit } from "#/audit/run-comments";
import { runDisplayNameAudit } from "#/audit/run-display-names";
import { runLinkAudit } from "#/audit/run-links";
import { runReactAudit } from "#/audit/run-react";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { consumeCliAppError } from "#/core/cli/result-handle";
import { nodeFilesystem } from "#/core/filesystem/node";
import { logger } from "#/core/logger";
import { parseWithSchema } from "#/core/schema-parse";

/**
 * Top-level `audit` command — the source scans. Every one of them reports by default; only
 * `comments --fix` writes, and only where the rewrite discards nothing a person wrote.
 *
 * @since 0.5.0-canary.6
 */
export function createAuditCommand(): Command {
  const cmd = new Command("audit").description("Source audits").enablePositionalOptions();

  cmd
    .command("rtl")
    .description("Report physical-direction Tailwind classes that should be logical or rtl:-paired")
    .argument("[target]", "Directory or file to scan (default: audit.rtl.target from config)")
    .option("--json", "Print one JSON summary on stdout", false)
    .action(async (target: string | undefined, opts: { json?: boolean }) => {
      const prelude = await prepareRtlAudit(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { rootDir, targetPath, allowlist } = prelude.value;
      const parsed = parseWithSchema(rtlAuditRunRequestSchema, {
        rootDir,
        targetPath,
        allowlist,
        json: !!opts.json,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }

      const outcome = runRtlAudit(nodeFilesystem, {
        rootDir: parsed.value.rootDir,
        targetPath: parsed.value.targetPath,
        allowlist: parsed.value.allowlist ?? [],
      });
      if (!consumeCliAppError(outcome)) {
        return;
      }

      if (parsed.value.json) {
        logger.out(formatRtlAuditJsonOutput(outcome.value, rootDir));
      } else {
        presentRtlAuditResult(outcome.value);
      }
      process.exitCode = exitCodeForRtlAuditResult(outcome.value);
    });

  cmd
    .command("links")
    .description("Report markdown links pointing at a missing path or an anchor the target does not offer")
    .argument("[target]", "Directory or file to scan (default: the repo root)")
    .option("--json", "Print one JSON summary on stdout", false)
    .action(async (target: string | undefined, opts: { json?: boolean }) => {
      const prelude = await prepareLinkAudit(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { rootDir, targetPath, allowlist } = prelude.value;
      const parsed = parseWithSchema(linkAuditRunRequestSchema, {
        rootDir,
        targetPath,
        allowlist,
        json: !!opts.json,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }

      const outcome = runLinkAudit(nodeFilesystem, {
        rootDir: parsed.value.rootDir,
        targetPath: parsed.value.targetPath,
        allowlist: parsed.value.allowlist ?? [],
      });
      if (!consumeCliAppError(outcome)) {
        return;
      }

      if (parsed.value.json) {
        logger.out(formatLinkAuditJsonOutput(outcome.value, rootDir));
      } else {
        presentLinkAuditResult(outcome.value);
      }
      process.exitCode = exitCodeForLinkAuditResult(outcome.value);
    });

  cmd
    .command("react")
    .description("Report React namespace/default imports and implicit React.* UMD-global type references")
    .argument("[target]", "Directory or file to scan (default: the repo root)")
    .option("--json", "Print one JSON summary on stdout", false)
    .action(async (target: string | undefined, opts: { json?: boolean }) => {
      const prelude = await prepareReactAudit(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { rootDir, targetPath, allowlist } = prelude.value;
      const parsed = parseWithSchema(reactAuditRunRequestSchema, {
        rootDir,
        targetPath,
        allowlist,
        json: !!opts.json,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }

      const outcome = runReactAudit(nodeFilesystem, {
        rootDir: parsed.value.rootDir,
        targetPath: parsed.value.targetPath,
        allowlist: parsed.value.allowlist ?? [],
      });
      if (!consumeCliAppError(outcome)) {
        return;
      }

      if (parsed.value.json) {
        logger.out(formatReactAuditJsonOutput(outcome.value, rootDir));
      } else {
        presentReactAuditResult(outcome.value);
      }
      process.exitCode = exitCodeForReactAuditResult(outcome.value);
    });

  cmd
    .command("display-names")
    .description("Report token(), tag() and module display names that break the <namespace>:<Name> convention")
    .argument("[target]", "Directory or file to scan (default: the repo root)")
    .option("--json", "Print one JSON summary on stdout", false)
    .action(async (target: string | undefined, opts: { json?: boolean }) => {
      const prelude = await prepareDisplayNameAudit(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { rootDir, targetPath, allowlist } = prelude.value;
      const parsed = parseWithSchema(displayNameAuditRunRequestSchema, {
        rootDir,
        targetPath,
        allowlist,
        json: !!opts.json,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }

      const outcome = runDisplayNameAudit(nodeFilesystem, {
        rootDir: parsed.value.rootDir,
        targetPath: parsed.value.targetPath,
        allowlist: parsed.value.allowlist ?? [],
      });
      if (!consumeCliAppError(outcome)) {
        return;
      }

      if (parsed.value.json) {
        logger.out(formatDisplayNameAuditJsonOutput(outcome.value, rootDir));
      } else {
        presentDisplayNameAuditResult(outcome.value);
      }
      process.exitCode = exitCodeForDisplayNameAuditResult(outcome.value);
    });

  cmd
    .command("comments")
    .description("Report section dividers that are not in the repo's one allowed form")
    .argument("[target]", "Directory or file to scan (default: the repo root)")
    .option("--fix", "Rewrite every mechanically fixable divider in place", false)
    .option("--json", "Print one JSON summary on stdout", false)
    .action(async (target: string | undefined, opts: { fix?: boolean; json?: boolean }) => {
      const prelude = await prepareCommentAudit(nodeFilesystem, {
        currentWorkingDirectory: process.cwd(),
        rawTarget: readOptionalPositionalArg(target),
      });
      if (!consumeCliAppError(prelude)) {
        return;
      }
      const { rootDir, targetPath, allowlist } = prelude.value;
      const parsed = parseWithSchema(commentAuditRunRequestSchema, {
        rootDir,
        targetPath,
        allowlist,
        fix: !!opts.fix,
        json: !!opts.json,
      });
      if (!consumeCliAppError(parsed)) {
        return;
      }

      const outcome = runCommentAudit(nodeFilesystem, {
        rootDir: parsed.value.rootDir,
        targetPath: parsed.value.targetPath,
        allowlist: parsed.value.allowlist ?? [],
        fix: parsed.value.fix,
      });
      if (!consumeCliAppError(outcome)) {
        return;
      }

      if (parsed.value.json) {
        logger.out(formatCommentAuditJsonOutput(outcome.value, rootDir));
      } else {
        presentCommentAuditResult(outcome.value);
      }
      process.exitCode = exitCodeForCommentAuditResult(outcome.value);
    });

  return cmd;
}
