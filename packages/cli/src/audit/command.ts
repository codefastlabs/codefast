import { Command } from "commander";

import { presentAssertionAuditResult } from "#audit/assertions/output";
import { runAssertionAudit } from "#audit/assertions/run";
import { presentCommentAuditResult } from "#audit/comments/output";
import { runCommentAudit } from "#audit/comments/run";
import { presentDisplayNameAuditResult } from "#audit/display-names/output";
import { runDisplayNameAudit } from "#audit/display-names/run";
import type {
  AssertionAuditResult,
  CommentAuditResult,
  DisplayNameAuditResult,
  EnginesAuditResult,
  ImportsAuditResult,
  LayersAuditResult,
  LinkAuditResult,
  PropsAuditResult,
  PublishAuditResult,
  RtlAuditResult,
} from "#audit/domain/types";
import { presentEnginesAuditResult } from "#audit/engines/output";
import { runEnginesAudit } from "#audit/engines/run";
import { presentImportsAuditResult } from "#audit/imports/output";
import { runImportsAudit } from "#audit/imports/run";
import { presentLayersAuditResult } from "#audit/layers/output";
import type { LayersAuditPrelude } from "#audit/layers/prepare";
import { prepareLayersAudit } from "#audit/layers/prepare";
import { runLayersAudit } from "#audit/layers/run";
import { presentLinkAuditResult } from "#audit/links/output";
import { runLinkAudit } from "#audit/links/run";
import type { AuditCommandPrelude } from "#audit/prepare";
import { prepareRepoRootAudit } from "#audit/prepare";
import { presentPropsAuditResult } from "#audit/props/output";
import { runPropsAudit } from "#audit/props/run";
import { presentPublishAuditResult } from "#audit/publish/output";
import { runPublishAudit } from "#audit/publish/run";
import { presentRtlAuditResult } from "#audit/rtl/output";
import { prepareRtlAudit } from "#audit/rtl/prepare";
import { runRtlAudit } from "#audit/rtl/run";
import type { NamedCommandPipeline } from "#core/cli/command-pipeline";
import { registerPipelineSubcommand } from "#core/cli/command-pipeline";
import type { CodefastConfig } from "#core/config/schema";
import type { AppError } from "#core/errors";
import { CLI_EXIT_GENERAL_ERROR, CLI_EXIT_SUCCESS } from "#core/exit-codes";
import type { Filesystem } from "#core/filesystem/filesystem";
import { nodeFilesystem } from "#core/filesystem/node";
import type { Result } from "#core/result";

type AuditActionOptions = {
  readonly json?: boolean;
  readonly fix?: boolean;
};

type AuditRequest<Prelude> = { readonly prelude: Prelude; readonly opts: AuditActionOptions };

type AuditPrepare<Prelude> = (
  fs: Filesystem,
  input: { readonly currentWorkingDirectory: string; readonly rawTarget: string | undefined },
) => Promise<Result<Prelude, AppError>>;

/**
 * One source audit: what it scans, how it runs, and when its result is clean.
 *
 * @remarks Most audits scan from the repo root with an allowlist from config; `rtl` (a configured default target) and
 * `layers` (the layered packages) resolve a prelude of their own.
 */
interface AuditCheck<CheckResult, Prelude extends AuditCommandPrelude = AuditCommandPrelude> {
  readonly name: string;
  readonly description: string;
  readonly targetHelp?: string | undefined;
  readonly prepare: AuditPrepare<Prelude>;
  readonly extraOptions?: ((command: Command) => void) | undefined;
  readonly run: (
    fs: Filesystem,
    prelude: Prelude,
    opts: AuditActionOptions,
  ) => Result<CheckResult, AppError> | Promise<Result<CheckResult, AppError>>;
  readonly present: (result: CheckResult) => void;
  readonly isClean: (result: CheckResult) => boolean;
}

const DEFAULT_TARGET_HELP = "Directory or file to scan (default: the repo root)";

// The prelude of an audit that scans from the repo root, taking its allowlist from the config key it names.
function fromRepoRoot(
  selectAllowlist: (config: CodefastConfig) => ReadonlyArray<string> | undefined = () => [],
): AuditPrepare<AuditCommandPrelude> {
  return (fs, input) => prepareRepoRootAudit(fs, input, (config) => selectAllowlist(config) ?? []);
}

/**
 * The machine output every audit prints for `--json`.
 *
 * @since 0.16.0
 */
export function formatAuditJson(result: unknown, rootDir: string, clean: boolean): string {
  return JSON.stringify({ schemaVersion: 1 as const, ok: clean, cwd: rootDir, result });
}

/**
 * The exit code every audit records: `1` while findings remain.
 *
 * @since 0.16.0
 */
export function auditExitCode(clean: boolean): number {
  return clean ? CLI_EXIT_SUCCESS : CLI_EXIT_GENERAL_ERROR;
}

const rtlCheck: AuditCheck<RtlAuditResult> = {
  name: "rtl",
  description: "Report physical-direction Tailwind classes that should be logical or rtl:-paired",
  targetHelp: "Directory or file to scan (default: audit.rtl.target from config)",
  prepare: prepareRtlAudit,
  run: (fs, prelude) => runRtlAudit(fs, prelude),
  present: presentRtlAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const linksCheck: AuditCheck<LinkAuditResult> = {
  name: "links",
  description: "Report markdown links pointing at a missing path or an anchor the target does not offer",
  prepare: fromRepoRoot((config) => config.audit?.links?.allowlist),
  run: (fs, prelude) => runLinkAudit(fs, prelude),
  present: presentLinkAuditResult,
  isClean: (result) => result.breakageCount === 0,
};

const importsCheck: AuditCheck<ImportsAuditResult> = {
  name: "imports",
  description: "Report banned import forms (React by-name, Zod namespace in front-end packages, …)",
  prepare: fromRepoRoot((config) => config.audit?.imports?.allowlist),
  run: (fs, prelude) => runImportsAudit(fs, prelude),
  present: presentImportsAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const assertionsCheck: AuditCheck<AssertionAuditResult> = {
  name: "assertions",
  description: "Report double type assertions through unknown or any (x as unknown as T), tests included",
  prepare: fromRepoRoot((config) => config.audit?.assertions?.allowlist),
  run: (fs, prelude) => runAssertionAudit(fs, prelude),
  present: presentAssertionAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const displayNamesCheck: AuditCheck<DisplayNameAuditResult> = {
  name: "display-names",
  description: "Report token(), tag() and module display names that break the <namespace>:<Name> convention",
  prepare: fromRepoRoot((config) => config.audit?.displayNames?.allowlist),
  run: (fs, prelude) => runDisplayNameAudit(fs, prelude),
  present: presentDisplayNameAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const propsCheck: AuditCheck<PropsAuditResult> = {
  name: "props",
  description:
    "Report component props aliases joined with & that an interface could express, judged by the type checker",
  prepare: fromRepoRoot((config) => config.audit?.props?.allowlist),
  run: (fs, prelude) => runPropsAudit(fs, prelude),
  present: presentPropsAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const commentsCheck: AuditCheck<CommentAuditResult> = {
  name: "comments",
  description: "Report section dividers that are not in the repo's one allowed form",
  prepare: fromRepoRoot((config) => config.audit?.comments?.allowlist),
  extraOptions: (command) => {
    command.option("--fix", "Rewrite every mechanically fixable divider in place", false);
  },
  run: (fs, prelude, opts) => runCommentAudit(fs, { ...prelude, fix: !!opts.fix }),
  present: presentCommentAuditResult,
  isClean: (result) => result.breakageCount === 0,
};

const layersCheck: AuditCheck<LayersAuditResult, LayersAuditPrelude> = {
  name: "layers",
  description: "Report value imports that point up a package's configured layers, and modules sitting in no layer",
  targetHelp: "Directory or file to scan (default: the repo root, reaching every package audit.layers names)",
  prepare: prepareLayersAudit,
  run: (fs, prelude) => runLayersAudit(fs, prelude),
  present: presentLayersAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const publishCheck: AuditCheck<PublishAuditResult> = {
  name: "publish",
  description:
    "Report what breaks a consumer's install: #/ imports, unshipped exports/imports targets, and stylesheet @source paths reaching nothing shipped",
  prepare: fromRepoRoot(),
  run: (fs, prelude) => runPublishAudit(fs, prelude),
  present: presentPublishAuditResult,
  isClean: (result) =>
    result.legacyImportCount === 0 && result.unshipped.length === 0 && result.unreachableStylesheets.length === 0,
};

const enginesCheck: AuditCheck<EnginesAuditResult> = {
  name: "engines",
  description:
    "Report Node floors (engines.node) that are missing, malformed, outside a dependency's engines, or off their @types/node line",
  prepare: fromRepoRoot(),
  run: (fs, prelude) => runEnginesAudit(fs, prelude),
  present: presentEnginesAuditResult,
  isClean: (result) => result.violations.length === 0,
};

function auditCheckToPipeline<CheckResult, Prelude extends AuditCommandPrelude>(
  check: AuditCheck<CheckResult, Prelude>,
): NamedCommandPipeline<Prelude, AuditRequest<Prelude>, CheckResult, never, AuditActionOptions> {
  return {
    name: check.name,
    description: check.description,
    positional: { name: "[target]", help: check.targetHelp ?? DEFAULT_TARGET_HELP },
    configureArgv: check.extraOptions,
    prepare: (fs, input) =>
      check.prepare(fs, { currentWorkingDirectory: input.currentWorkingDirectory, rawTarget: input.rawArg }),
    buildRequest: ({ prelude, opts }) => ({ prelude, opts }),
    run: async (fs, request) => check.run(fs, request.prelude, request.opts),
    presentHuman: ({ result }) => check.present(result),
    formatJson: ({ result, prelude }) => formatAuditJson(result, prelude.rootDir, check.isClean(result)),
    exitCode: (result) => auditExitCode(check.isClean(result)),
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
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(assertionsCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(displayNamesCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(propsCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(commentsCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(layersCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(publishCheck));
  registerPipelineSubcommand(cmd, nodeFilesystem, auditCheckToPipeline(enginesCheck));

  return cmd;
}
