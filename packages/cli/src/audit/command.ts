import { Command } from "commander";

import { presentAssertionAuditResult } from "#audit/assertions/output";
import { runAssertionAudit } from "#audit/assertions/run";
import { auditAllExitCode, auditExitCode, formatAuditAllJson, formatAuditJson } from "#audit/cli-result";
import { presentCommentAuditResult } from "#audit/comments/output";
import { runCommentAudit } from "#audit/comments/run";
import { presentDisplayNameAuditResult } from "#audit/display-names/output";
import { runDisplayNameAudit } from "#audit/display-names/run";
import type {
  AssertionAuditResult,
  AuditOutcome,
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
import { presentAuditAll } from "#audit/output";
import type { AuditCommandPrelude } from "#audit/prepare";
import { prepareRepoRootAudit, prepareRepoRootAuditWith } from "#audit/prepare";
import { presentPropsAuditResult } from "#audit/props/output";
import { runPropsAudit } from "#audit/props/run";
import { presentPublishAuditResult } from "#audit/publish/output";
import { runPublishAudit } from "#audit/publish/run";
import { presentRtlAuditResult } from "#audit/rtl/output";
import { prepareRtlAudit } from "#audit/rtl/prepare";
import { runRtlAudit } from "#audit/rtl/run";
import type { BaseCommandOptions, CommandPipeline, NamedCommandPipeline } from "#core/cli/command-pipeline";
import { applyCommandPipeline, registerPipelineSubcommand } from "#core/cli/command-pipeline";
import type { CodefastConfig } from "#core/config/schema";
import type { AppError } from "#core/errors";
import type { Filesystem } from "#core/filesystem/filesystem";
import { nodeFilesystem } from "#core/filesystem/node";
import type { Result } from "#core/result";
import { ok } from "#core/result";

type AuditActionOptions = BaseCommandOptions & { readonly fix?: boolean };

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
  /** Why a full `audit` run passes over this check for the loaded config, when it has nothing to scan. */
  readonly skipReason?: ((config: CodefastConfig) => string | undefined) | undefined;
}

const DEFAULT_TARGET_HELP = "Directory or file to scan (default: the repo root)";

// The prelude of an audit that scans from the repo root, taking its allowlist from the config key it names.
function fromRepoRoot(
  selectAllowlist: (config: CodefastConfig) => ReadonlyArray<string> | undefined = () => [],
): AuditPrepare<AuditCommandPrelude> {
  return (fs, input) => prepareRepoRootAudit(fs, input, (config) => selectAllowlist(config) ?? []);
}

const rtlCheck: AuditCheck<RtlAuditResult> = {
  name: "rtl",
  description: "Report physical-direction Tailwind classes that should be logical or rtl:-paired",
  targetHelp: "Directory or file to scan (default: audit.rtl.target from config)",
  prepare: prepareRtlAudit,
  run: (fs, prelude) => runRtlAudit(fs, prelude),
  present: presentRtlAuditResult,
  isClean: (result) => result.violationCount === 0,
  skipReason: (config) => (config.audit?.rtl?.target === undefined ? "no audit.rtl.target in the config" : undefined),
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
  description: "Report banned import forms (React imports that are not named-only, Zod imported by name, …)",
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
  description:
    "Report comment defects: off-form section dividers, banned content, invalid TSDoc, dangling links and impossible @since",
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

// ── Every audit at once ──────────────────────────────────────────────────────────────────────────────────────────────

type AuditAllRequest = {
  readonly currentWorkingDirectory: string;
  readonly config: CodefastConfig;
  readonly opts: AuditActionOptions;
};

/** An audit as the full run sees it: registered as its own subcommand, and runnable over the repo root. */
interface RegisteredAudit {
  readonly pipeline: (fs: Filesystem) => (parent: Command) => void;
  readonly runOverRepo: (fs: Filesystem, request: AuditAllRequest) => Promise<AuditOutcome>;
}

function registeredAudit<CheckResult, Prelude extends AuditCommandPrelude>(
  check: AuditCheck<CheckResult, Prelude>,
): RegisteredAudit {
  return {
    pipeline: (fs) => (parent) => registerPipelineSubcommand(parent, fs, auditCheckToPipeline(check)),
    runOverRepo: async (fs, request) => {
      const skipReason = check.skipReason?.(request.config);
      if (skipReason !== undefined) {
        return { name: check.name, status: "skipped", reason: skipReason };
      }
      const prelude = await check.prepare(fs, {
        currentWorkingDirectory: request.currentWorkingDirectory,
        rawTarget: undefined,
      });
      if (!prelude.ok) {
        return { name: check.name, status: "error", error: prelude.error };
      }
      const outcome = await check.run(fs, prelude.value, request.opts);
      if (!outcome.ok) {
        return { name: check.name, status: "error", error: outcome.error };
      }
      const result = outcome.value;
      return {
        name: check.name,
        status: check.isClean(result) ? "clean" : "findings",
        result,
        present: () => check.present(result),
      };
    },
  };
}

const AUDITS: ReadonlyArray<RegisteredAudit> = [
  registeredAudit(rtlCheck),
  registeredAudit(linksCheck),
  registeredAudit(importsCheck),
  registeredAudit(assertionsCheck),
  registeredAudit(displayNamesCheck),
  registeredAudit(propsCheck),
  registeredAudit(commentsCheck),
  registeredAudit(layersCheck),
  registeredAudit(publishCheck),
  registeredAudit(enginesCheck),
];

type AuditAllPrelude = AuditCommandPrelude & {
  readonly currentWorkingDirectory: string;
  readonly config: CodefastConfig;
};

const auditAllPipeline: CommandPipeline<
  AuditAllPrelude,
  AuditAllRequest,
  ReadonlyArray<AuditOutcome>,
  never,
  AuditActionOptions
> = {
  configureArgv: (command) => {
    command.option("--fix", "Apply the mechanical fixes an audit offers (comments)", false);
  },
  prepare: (fs, { currentWorkingDirectory }) =>
    prepareRepoRootAuditWith(fs, { currentWorkingDirectory, rawTarget: undefined }, (config) =>
      Promise.resolve(ok({ allowlist: [], config, currentWorkingDirectory })),
    ),
  buildRequest: ({ prelude, opts }) => ({
    currentWorkingDirectory: prelude.currentWorkingDirectory,
    config: prelude.config,
    opts,
  }),
  run: async (fs, request) => {
    const outcomes: Array<AuditOutcome> = [];
    for (const audit of AUDITS) {
      outcomes.push(await audit.runOverRepo(fs, request));
    }
    return ok(outcomes);
  },
  presentHuman: ({ result, opts }) => presentAuditAll(result, !!opts.verbose),
  formatJson: ({ result, prelude }) => formatAuditAllJson(result, prelude.rootDir),
  exitCode: auditAllExitCode,
};

/**
 * Top-level `audit` command — the source scans. Run bare, it runs every audit over the repo root and reports each;
 * every audit only reports, except `comments --fix`, which writes only where the rewrite discards nothing a person
 * wrote.
 *
 * @since 0.5.0-canary.6
 */
export function createAuditCommand(): Command {
  const cmd = new Command("audit")
    .description("Source audits — run bare to run every audit over the repo root")
    .enablePositionalOptions();

  for (const audit of AUDITS) {
    audit.pipeline(nodeFilesystem)(cmd);
  }
  applyCommandPipeline(cmd, nodeFilesystem, auditAllPipeline);

  return cmd;
}
