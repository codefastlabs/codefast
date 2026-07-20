import process from "node:process";

import { Command } from "commander";

import { rtlAuditRunRequestSchema } from "#/audit/cli-schema";
import { exitCodeForRtlAuditResult, formatRtlAuditJsonOutput, presentRtlAuditResult } from "#/audit/output";
import { prepareRtlAudit } from "#/audit/prepare";
import { runRtlAudit } from "#/audit/run";
import { readOptionalPositionalArg } from "#/core/cli/positional";
import { consumeCliAppError } from "#/core/cli/result-handle";
import { nodeFilesystem } from "#/core/filesystem/node";
import { logger } from "#/core/logger";
import { parseWithSchema } from "#/core/schema-parse";

/**
 * Top-level `audit` command — currently hosts the RTL physical-class scan.
 *
 * @since 1.0.0-canary.7
 */
export function createAuditCommand(): Command {
  const cmd = new Command("audit").description("Read-only source audits").enablePositionalOptions();

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

  return cmd;
}
