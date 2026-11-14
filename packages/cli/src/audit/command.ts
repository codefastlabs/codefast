import type { Command } from "commander";

import { presentAssertionAuditResult } from "#audit/assertions/output";
import { runAssertionAudit } from "#audit/assertions/run";
import { presentCommentAuditResult } from "#audit/comments/output";
import { runCommentAudit } from "#audit/comments/run";
import { presentDisplayNameAuditResult } from "#audit/display-names/output";
import { runDisplayNameAudit } from "#audit/display-names/run";
import type {
  AssertionAuditResult,
  AuditAllReport,
  AuditRun,
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
import { resolveLayeredPackages } from "#audit/layers/layered-packages";
import { presentLayersAuditResult } from "#audit/layers/output";
import { runLayersAudit } from "#audit/layers/run";
import { presentLinkAuditResult } from "#audit/links/output";
import { runLinkAudit } from "#audit/links/run";
import { presentAuditAll } from "#audit/output";
import { presentPropsAuditResult } from "#audit/props/output";
import { runPropsAudit } from "#audit/props/run";
import { presentPublishAuditResult } from "#audit/publish/output";
import { runPublishAudit } from "#audit/publish/run";
import { presentRtlAuditResult } from "#audit/rtl/output";
import { runRtlAudit } from "#audit/rtl/run";
import type { CommandContext, CommandSpec } from "#core/command";
import { createCommand, deriveContext, presentAppError } from "#core/command";
import type { CodefastConfig } from "#core/config/schema";
import type { AppError } from "#core/errors";
import type { Result } from "#core/result";
import { ok } from "#core/result";

/**
 * One audit: what it reports, the target its config may name, how it runs, and when its result is clean.
 */
interface AuditCheck<CheckResult> {
  readonly name: string;
  readonly description: string;
  readonly configuredTarget?: ((config: CodefastConfig) => string | undefined) | undefined;
  /** Why a full `audit` run passes over this audit for the loaded config, when it has nothing to scan. */
  readonly skipReason?: ((config: CodefastConfig) => string | undefined) | undefined;
  readonly run: (context: AuditContext) => Result<CheckResult, AppError> | Promise<Result<CheckResult, AppError>>;
  readonly present: (result: CheckResult) => void;
  readonly isClean: (result: CheckResult) => boolean;
}

/** What an audit runs with: every audit takes `--fix`, and applies whatever fixes its findings carry. */
type AuditContext = CommandContext<"fix">;

// The scan arguments every file audit takes: the root, the target, and its allowlist from the config.
function scanOf(
  context: AuditContext,
  allowlist: ReadonlyArray<string> | undefined,
): { rootDir: string; targetPath: string; allowlist: ReadonlyArray<string> } {
  return { rootDir: context.workspace.rootDir, targetPath: context.target.path, allowlist: allowlist ?? [] };
}

const rtlCheck: AuditCheck<RtlAuditResult> = {
  name: "rtl",
  description: "Report physical-direction Tailwind classes that should be logical or rtl:-paired",
  configuredTarget: (config) => config.audit?.rtl?.target,
  skipReason: (config) => (config.audit?.rtl?.target === undefined ? "no audit.rtl.target in the config" : undefined),
  run: (context) => runRtlAudit(context.fs, scanOf(context, context.workspace.config.audit?.rtl?.allowlist)),
  present: presentRtlAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const linksCheck: AuditCheck<LinkAuditResult> = {
  name: "links",
  description: "Report markdown links pointing at a missing path or an anchor the target does not offer",
  run: (context) => runLinkAudit(context.fs, scanOf(context, context.workspace.config.audit?.links?.allowlist)),
  present: presentLinkAuditResult,
  isClean: (result) => result.breakageCount === 0,
};

const importsCheck: AuditCheck<ImportsAuditResult> = {
  name: "imports",
  description: "Report banned import forms (React imports that are not named-only, Zod imported by name, …)",
  run: (context) => runImportsAudit(context.fs, scanOf(context, context.workspace.config.audit?.imports?.allowlist)),
  present: presentImportsAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const assertionsCheck: AuditCheck<AssertionAuditResult> = {
  name: "assertions",
  description: "Report double type assertions through unknown or any (x as unknown as T), tests included",
  run: (context) =>
    runAssertionAudit(context.fs, scanOf(context, context.workspace.config.audit?.assertions?.allowlist)),
  present: presentAssertionAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const displayNamesCheck: AuditCheck<DisplayNameAuditResult> = {
  name: "display-names",
  description: "Report token(), tag() and module display names that break the <namespace>:<Name> convention",
  run: (context) =>
    runDisplayNameAudit(context.fs, scanOf(context, context.workspace.config.audit?.displayNames?.allowlist)),
  present: presentDisplayNameAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const propsCheck: AuditCheck<PropsAuditResult> = {
  name: "props",
  description:
    "Report component props aliases joined with & that an interface could express, judged by the type checker",
  run: (context) => runPropsAudit(context.fs, scanOf(context, context.workspace.config.audit?.props?.allowlist)),
  present: presentPropsAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const commentsCheck: AuditCheck<CommentAuditResult> = {
  name: "comments",
  description:
    "Report comment defects: off-form section dividers, banned content, invalid TSDoc, dangling links and impossible @since",
  run: (context) =>
    runCommentAudit(context.fs, {
      ...scanOf(context, context.workspace.config.audit?.comments?.allowlist),
      fix: context.flags.fix,
    }),
  present: presentCommentAuditResult,
  isClean: (result) => result.breakageCount === 0,
};

const layersCheck: AuditCheck<LayersAuditResult> = {
  name: "layers",
  description: "Report value imports that point up a package's configured layers, and modules sitting in no layer",
  run: (context) => {
    const packages = resolveLayeredPackages(context.fs, context.workspace);
    return packages.ok
      ? runLayersAudit(context.fs, {
          ...scanOf(context, context.workspace.config.audit?.layers?.allowlist),
          packages: packages.value,
        })
      : packages;
  },
  present: presentLayersAuditResult,
  isClean: (result) => result.violationCount === 0,
};

const publishCheck: AuditCheck<PublishAuditResult> = {
  name: "publish",
  description:
    "Report what breaks a consumer's install: #/ imports, unshipped exports/imports targets, and stylesheet @source paths reaching nothing shipped",
  run: (context) => runPublishAudit(context.fs, { workspace: context.workspace, targetPath: context.target.path }),
  present: presentPublishAuditResult,
  isClean: (result) =>
    result.legacyImportCount === 0 && result.unshipped.length === 0 && result.unreachableStylesheets.length === 0,
};

const enginesCheck: AuditCheck<EnginesAuditResult> = {
  name: "engines",
  description:
    "Report Node floors (engines.node) that are missing, malformed, outside a dependency's engines, or off their @types/node line",
  run: (context) => runEnginesAudit(context.fs, { workspace: context.workspace, targetPath: context.target.path }),
  present: presentEnginesAuditResult,
  isClean: (result) => result.violations.length === 0,
};

const TARGET_HELP = "A file or directory to scan (default: the project root)";

const FIX_HELP = "Apply the mechanical fixes the findings carry, writing the files in place";

function auditSpec<CheckResult>(check: AuditCheck<CheckResult>): CommandSpec<CheckResult, "fix"> {
  return {
    name: `audit:${check.name}`,
    description: check.description,
    targetHelp:
      check.configuredTarget === undefined
        ? TARGET_HELP
        : "A file or directory to scan (default: the configured target, else the project root)",
    flags: { fix: FIX_HELP },
    configuredTarget: check.configuredTarget,
    run: async (context) => check.run(context),
    verdict: (result) => (check.isClean(result) ? "pass" : "fail"),
    present: (result) => check.present(result),
  };
}

/** An audit as the full run sees it: a command of its own, and a run on behalf of `audit`. */
interface RegisteredAudit {
  readonly command: () => Command;
  readonly runFor: (parent: AuditContext) => Promise<AuditRun>;
}

function registeredAudit<CheckResult>(check: AuditCheck<CheckResult>): RegisteredAudit {
  return {
    command: () => createCommand(auditSpec(check)),
    runFor: async (parent) => {
      const skipReason = check.skipReason?.(parent.workspace.config);
      if (skipReason !== undefined && !parent.targetGiven) {
        return { name: check.name, status: "skipped", reason: skipReason, present: () => {} };
      }
      const context = deriveContext(parent, check.configuredTarget, parent.flags);
      const outcome = context.ok ? await check.run(context.value) : context;
      if (!outcome.ok) {
        const { code, message } = outcome.error;
        return {
          name: check.name,
          status: "error",
          error: { code, message },
          present: () => presentAppError(outcome.error, parent.verbose),
        };
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

const auditAllCommand: CommandSpec<AuditAllReport, "fix"> = {
  name: "audit",
  description: "Run every audit and report each under its name",
  targetHelp: "A file or directory every audit scans (default: each audit's configured target, else the project root)",
  flags: { fix: FIX_HELP },
  run: async (context) => {
    const audits: Array<AuditRun> = [];
    for (const audit of AUDITS) {
      audits.push(await audit.runFor(context));
    }
    return ok({ audits });
  },
  verdict: (report) => {
    if (report.audits.some((run) => run.status === "error")) {
      return "error";
    }
    return report.audits.some((run) => run.status === "findings") ? "fail" : "pass";
  },
  present: (report, context) => presentAuditAll(report, context.elapsedSeconds),
};

/**
 * Creates the `audit` command, which runs every audit, followed by one `audit:<name>` command per audit.
 */
export function createAuditCommands(): Array<Command> {
  return [createCommand(auditAllCommand), ...AUDITS.map((audit) => audit.command())];
}
