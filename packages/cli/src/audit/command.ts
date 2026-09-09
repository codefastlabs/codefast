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
import type { NamedCommandPipeline } from "#/core/cli/command-pipeline";
import { registerPipelineSubcommand } from "#/core/cli/command-pipeline";
import type { AppError } from "#/core/errors";
import type { Filesystem } from "#/core/filesystem/filesystem";
import { nodeFilesystem } from "#/core/filesystem/node";
import type { Result } from "#/core/result";

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
    fs: Filesystem,
    input: { readonly currentWorkingDirectory: string; readonly rawTarget: string | undefined },
  ) => Promise<Result<AuditCommandPrelude, AppError>>;
  readonly buildRequest: (prelude: AuditCommandPrelude, opts: AuditActionOptions) => unknown;
  readonly run: (fs: Filesystem, request: Request) => Result<CheckResult, AppError>;
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
 * Adapts an `AuditCheck` descriptor onto the shared command pipeline.
 */
function auditCheckToPipeline<Request, CheckResult>(
  check: AuditCheck<Request, CheckResult>,
): NamedCommandPipeline<AuditCommandPrelude, Request, CheckResult, never, AuditActionOptions> {
  return {
    name: check.name,
    description: check.description,
    positional: { name: "[target]", help: check.targetHelp },
    jsonHelp: "Print one JSON summary on stdout",
    schema: check.schema,
    configureArgv: check.extraOptions,
    prepare: (fs, input) =>
      check.prepare(fs, { currentWorkingDirectory: input.currentWorkingDirectory, rawTarget: input.rawArg }),
    buildRequest: ({ prelude, opts }) => check.buildRequest(prelude, opts),
    run: async (fs, request) => check.run(fs, request),
    presentHuman: ({ result }) => check.present(result),
    formatJson: ({ result, prelude }) => check.formatJson(result, prelude.rootDir),
    exitCode: check.exitCode,
  };
}

/**
 * Top-level `audit` command — the source scans. Every one of them reports by default; only
 * `comments --fix` writes, and only where the rewrite discards nothing a person wrote.
 *
 * @since 0.5.0-canary.6
 */
export function createAuditCommand(): Command {
  const cmd = new Command("audit").description("Source audits").enablePositionalOptions();

  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(rtlCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(linksCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(importsCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(displayNamesCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(commentsCheck));

  return cmd;
}
