import process from "node:process";

import { Command } from "commander";
import type { ZodType } from "zod";

import { exitCodeForCommentAuditResult, formatCommentAuditJsonOutput } from "#/audit/comments/cli-result";
import type { CommentAuditRunRequest } from "#/audit/comments/cli-schema";
import { commentAuditRunRequestSchema } from "#/audit/comments/cli-schema";
import { presentCommentAuditResult } from "#/audit/comments/output";
import { prepareCommentAudit } from "#/audit/comments/prepare";
import { runCommentAudit } from "#/audit/comments/run";
import { exitCodeForDisplayNameAuditResult, formatDisplayNameAuditJsonOutput } from "#/audit/display-names/cli-result";
import type { DisplayNameAuditRunRequest } from "#/audit/display-names/cli-schema";
import { displayNameAuditRunRequestSchema } from "#/audit/display-names/cli-schema";
import { presentDisplayNameAuditResult } from "#/audit/display-names/output";
import { prepareDisplayNameAudit } from "#/audit/display-names/prepare";
import { runDisplayNameAudit } from "#/audit/display-names/run";
import type {
  CommentAuditResult,
  DisplayNameAuditResult,
  ImportsAuditResult,
  LinkAuditResult,
  RtlAuditResult,
} from "#/audit/domain/types";
import { exitCodeForImportsAuditResult, formatImportsAuditJsonOutput } from "#/audit/imports/cli-result";
import type { ImportsAuditRunRequest } from "#/audit/imports/cli-schema";
import { importsAuditRunRequestSchema } from "#/audit/imports/cli-schema";
import { presentImportsAuditResult } from "#/audit/imports/output";
import { prepareImportsAudit } from "#/audit/imports/prepare";
import { runImportsAudit } from "#/audit/imports/run";
import { exitCodeForLinkAuditResult, formatLinkAuditJsonOutput } from "#/audit/links/cli-result";
import type { LinkAuditRunRequest } from "#/audit/links/cli-schema";
import { linkAuditRunRequestSchema } from "#/audit/links/cli-schema";
import { presentLinkAuditResult } from "#/audit/links/output";
import { prepareLinkAudit } from "#/audit/links/prepare";
import { runLinkAudit } from "#/audit/links/run";
import type { AuditCommandPrelude } from "#/audit/prepare";
import { exitCodeForRtlAuditResult, formatRtlAuditJsonOutput } from "#/audit/rtl/cli-result";
import type { RtlAuditRunRequest } from "#/audit/rtl/cli-schema";
import { rtlAuditRunRequestSchema } from "#/audit/rtl/cli-schema";
import { presentRtlAuditResult } from "#/audit/rtl/output";
import { prepareRtlAudit } from "#/audit/rtl/prepare";
import { runRtlAudit } from "#/audit/rtl/run";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { consumeCliAppError } from "#/core/cli/result-handle";
import type { AppError } from "#/core/errors";
import { nodeFilesystem } from "#/core/filesystem/node";
import type { FilesystemPort } from "#/core/filesystem/port";
import { logger } from "#/core/logger";
import type { Result } from "#/core/result";
import { parseWithSchema } from "#/core/schema-parse";

type AuditActionOptions = {
  readonly json?: boolean;
  readonly fix?: boolean;
};

/**
 * One source audit: its argv contract, the prelude/run pipeline, and how it reports.
 */
interface AuditCheck<Request, CheckResult> {
  readonly name: string;
  readonly description: string;
  readonly targetHelp: string;
  readonly schema: ZodType<Request>;
  readonly prepare: (
    fs: FilesystemPort,
    input: { readonly currentWorkingDirectory: string; readonly rawTarget: string | undefined },
  ) => Promise<Result<AuditCommandPrelude, AppError>>;
  readonly buildRequest: (prelude: AuditCommandPrelude, opts: AuditActionOptions) => unknown;
  readonly run: (fs: FilesystemPort, request: Request) => Result<CheckResult, AppError>;
  readonly present: (result: CheckResult) => void;
  readonly formatJson: (result: CheckResult, rootDir: string) => string;
  readonly exitCode: (result: CheckResult) => number;
  readonly extraOptions?: (command: Command) => void;
}

function baseAuditRequest(prelude: AuditCommandPrelude, opts: AuditActionOptions): Record<string, unknown> {
  return {
    rootDir: prelude.rootDir,
    targetPath: prelude.targetPath,
    allowlist: prelude.allowlist,
    json: !!opts.json,
  };
}

const rtlCheck: AuditCheck<RtlAuditRunRequest, RtlAuditResult> = {
  name: "rtl",
  description: "Report physical-direction Tailwind classes that should be logical or rtl:-paired",
  targetHelp: "Directory or file to scan (default: audit.rtl.target from config)",
  schema: rtlAuditRunRequestSchema,
  prepare: prepareRtlAudit,
  buildRequest: baseAuditRequest,
  run: (fs, request) =>
    runRtlAudit(fs, { rootDir: request.rootDir, targetPath: request.targetPath, allowlist: request.allowlist ?? [] }),
  present: presentRtlAuditResult,
  formatJson: formatRtlAuditJsonOutput,
  exitCode: exitCodeForRtlAuditResult,
};

const linksCheck: AuditCheck<LinkAuditRunRequest, LinkAuditResult> = {
  name: "links",
  description: "Report markdown links pointing at a missing path or an anchor the target does not offer",
  targetHelp: "Directory or file to scan (default: the repo root)",
  schema: linkAuditRunRequestSchema,
  prepare: prepareLinkAudit,
  buildRequest: baseAuditRequest,
  run: (fs, request) =>
    runLinkAudit(fs, { rootDir: request.rootDir, targetPath: request.targetPath, allowlist: request.allowlist ?? [] }),
  present: presentLinkAuditResult,
  formatJson: formatLinkAuditJsonOutput,
  exitCode: exitCodeForLinkAuditResult,
};

const importsCheck: AuditCheck<ImportsAuditRunRequest, ImportsAuditResult> = {
  name: "imports",
  description: "Report banned import forms (React by-name, Zod namespace in front-end packages, …)",
  targetHelp: "Directory or file to scan (default: the repo root)",
  schema: importsAuditRunRequestSchema,
  prepare: prepareImportsAudit,
  buildRequest: baseAuditRequest,
  run: (fs, request) =>
    runImportsAudit(fs, {
      rootDir: request.rootDir,
      targetPath: request.targetPath,
      allowlist: request.allowlist ?? [],
    }),
  present: presentImportsAuditResult,
  formatJson: formatImportsAuditJsonOutput,
  exitCode: exitCodeForImportsAuditResult,
};

const displayNamesCheck: AuditCheck<DisplayNameAuditRunRequest, DisplayNameAuditResult> = {
  name: "display-names",
  description: "Report token(), tag() and module display names that break the <namespace>:<Name> convention",
  targetHelp: "Directory or file to scan (default: the repo root)",
  schema: displayNameAuditRunRequestSchema,
  prepare: prepareDisplayNameAudit,
  buildRequest: baseAuditRequest,
  run: (fs, request) =>
    runDisplayNameAudit(fs, {
      rootDir: request.rootDir,
      targetPath: request.targetPath,
      allowlist: request.allowlist ?? [],
    }),
  present: presentDisplayNameAuditResult,
  formatJson: formatDisplayNameAuditJsonOutput,
  exitCode: exitCodeForDisplayNameAuditResult,
};

const commentsCheck: AuditCheck<CommentAuditRunRequest, CommentAuditResult> = {
  name: "comments",
  description: "Report section dividers that are not in the repo's one allowed form",
  targetHelp: "Directory or file to scan (default: the repo root)",
  schema: commentAuditRunRequestSchema,
  prepare: prepareCommentAudit,
  buildRequest: (prelude, opts) => ({ ...baseAuditRequest(prelude, opts), fix: !!opts.fix }),
  run: (fs, request) =>
    runCommentAudit(fs, {
      rootDir: request.rootDir,
      targetPath: request.targetPath,
      allowlist: request.allowlist ?? [],
      fix: request.fix,
    }),
  present: presentCommentAuditResult,
  formatJson: formatCommentAuditJsonOutput,
  exitCode: exitCodeForCommentAuditResult,
  extraOptions: (command) => {
    command.option("--fix", "Rewrite every mechanically fixable divider in place", false);
  },
};

/**
 * Top-level `audit` command — the source scans. Every one of them reports by default; only
 * `comments --fix` writes, and only where the rewrite discards nothing a person wrote.
 *
 * @since 0.5.0-canary.6
 */
export function createAuditCommand(): Command {
  const cmd = new Command("audit").description("Source audits").enablePositionalOptions();

  registerAuditCheck(cmd, rtlCheck);
  registerAuditCheck(cmd, linksCheck);
  registerAuditCheck(cmd, importsCheck);
  registerAuditCheck(cmd, displayNamesCheck);
  registerAuditCheck(cmd, commentsCheck);

  return cmd;
}

function registerAuditCheck<Request, CheckResult>(parent: Command, check: AuditCheck<Request, CheckResult>): void {
  const sub = parent
    .command(check.name)
    .description(check.description)
    .argument("[target]", check.targetHelp)
    .option("--json", "Print one JSON summary on stdout", false);
  check.extraOptions?.(sub);
  sub.action(makeAuditAction(check));
}

function makeAuditAction<Request, CheckResult>(
  check: AuditCheck<Request, CheckResult>,
): (target: string | undefined, opts: AuditActionOptions) => Promise<void> {
  return async (target, opts) => {
    const prelude = await check.prepare(nodeFilesystem, {
      currentWorkingDirectory: process.cwd(),
      rawTarget: readOptionalPositionalArg(target),
    });
    if (!consumeCliAppError(prelude)) {
      return;
    }
    const parsed = parseWithSchema(check.schema, check.buildRequest(prelude.value, opts));
    if (!consumeCliAppError(parsed)) {
      return;
    }
    const outcome = check.run(nodeFilesystem, parsed.value);
    if (!consumeCliAppError(outcome)) {
      return;
    }
    if (opts.json) {
      logger.out(check.formatJson(outcome.value, prelude.value.rootDir));
    } else {
      check.present(outcome.value);
    }
    process.exitCode = check.exitCode(outcome.value);
  };
}
