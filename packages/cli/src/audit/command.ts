import path from "node:path";

import type { Command } from "commander";

import { assertionsAudit } from "#audit/assertions/command";
import { commentsAudit } from "#audit/comments/command";
import { displayNamesAudit } from "#audit/display-names/command";
import { applyAllowlist } from "#audit/domain/findings";
import type { Audit, AuditAllReport, AuditContext, AuditReport, AuditRun } from "#audit/domain/types";
import { enginesAudit } from "#audit/engines/command";
import { importsAudit } from "#audit/imports/command";
import { layersAudit } from "#audit/layers/command";
import { linksAudit } from "#audit/links/command";
import { presentAuditAll, presentAuditReport } from "#audit/output";
import { propsAudit } from "#audit/props/command";
import { publishAudit } from "#audit/publish/command";
import { rtlAudit } from "#audit/rtl/command";
import type { CommandSpec } from "#core/command";
import { createCommand, deriveContext } from "#core/command";
import type { CodefastConfig } from "#core/config/schema";
import type { AppError } from "#core/errors";
import type { Result } from "#core/result";
import { ok } from "#core/result";

const AUDITS: ReadonlyArray<Audit> = [
  rtlAudit,
  linksAudit,
  importsAudit,
  assertionsAudit,
  displayNamesAudit,
  propsAudit,
  commentsAudit,
  layersAudit,
  publishAudit,
  enginesAudit,
];

const FIX_HELP = "Apply the mechanical fixes the findings carry, writing the files in place";

function sectionOf(config: CodefastConfig, audit: Audit) {
  return config.audit?.[audit.configKey];
}

function configuredTarget(audit: Audit): (config: CodefastConfig) => string | undefined {
  return (config) => {
    const section = sectionOf(config, audit);
    return section === false ? undefined : section?.target;
  };
}

async function runAudit(audit: Audit, context: AuditContext): Promise<Result<AuditReport, AppError>> {
  const scan = await audit.scan(context);
  if (!scan.ok) {
    return scan;
  }
  const section = sectionOf(context.workspace.config, audit);
  return ok(applyAllowlist(scan.value, section === false ? [] : (section?.allowlist ?? [])));
}

function fixedPaths(rootDir: string, reports: ReadonlyArray<AuditReport>): Array<string> {
  return reports.flatMap((report) => report.fixedFiles.map((file) => path.join(rootDir, file)));
}

function auditSpec(audit: Audit): CommandSpec<AuditReport, "fix"> {
  return {
    name: `audit:${audit.name}`,
    description: audit.description,
    targetHelp: "A file or directory to scan (default: the target the config names, else the project root)",
    flags: { fix: FIX_HELP },
    configuredTarget: configuredTarget(audit),
    run: (context) => runAudit(audit, context),
    verdict: (report) => (report.findings.length === 0 ? "pass" : "fail"),
    present: (report, context) => presentAuditReport(audit.name, report, context.elapsedSeconds),
    writtenFiles: (report, context) => fixedPaths(context.workspace.rootDir, [report]),
  };
}

async function runFor(audit: Audit, parent: AuditContext): Promise<AuditRun> {
  if (sectionOf(parent.workspace.config, audit) === false) {
    return { name: audit.name, status: "skipped", reason: "turned off in the config" };
  }
  const context = deriveContext(parent, configuredTarget(audit), parent.flags);
  const outcome = context.ok ? await runAudit(audit, context.value) : context;
  if (!outcome.ok) {
    const { code, message } = outcome.error;
    return { name: audit.name, status: "error", error: { code, message } };
  }
  return {
    name: audit.name,
    status: outcome.value.findings.length === 0 ? "clean" : "findings",
    result: outcome.value,
  };
}

const auditAllSpec: CommandSpec<AuditAllReport, "fix"> = {
  name: "audit",
  description: "Run every audit and report each under its name",
  targetHelp: "A file or directory every audit scans (default: each audit's configured target, else the project root)",
  flags: { fix: FIX_HELP },
  run: async (context) => {
    const audits: Array<AuditRun> = [];
    for (const audit of AUDITS) {
      audits.push(await runFor(audit, context));
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
  writtenFiles: (report, context) =>
    fixedPaths(
      context.workspace.rootDir,
      report.audits.flatMap((run) => (run.status === "clean" || run.status === "findings" ? [run.result] : [])),
    ),
};

/**
 * Creates the `audit` command, which runs every audit, followed by one `audit:<name>` command per audit.
 */
export function createAuditCommands(): Array<Command> {
  return [createCommand(auditAllSpec), ...AUDITS.map((audit) => createCommand(auditSpec(audit)))];
}
