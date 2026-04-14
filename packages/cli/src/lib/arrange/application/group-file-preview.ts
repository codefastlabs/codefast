import type { CliLogger } from "#lib/core/application/ports/cli-io.port";
import type {
  GroupFileUnwrapPlan,
  GroupFileWorkPlan,
} from "#lib/arrange/domain/arrange-grouping.service";
import { lineOf } from "#lib/arrange/domain/ast/ast-helpers";
import type {
  DomainCallExpression,
  DomainSourceFile,
} from "#lib/arrange/domain/ast/ast-node.model";
import type { PlannedGroupEdit } from "#lib/arrange/domain/types";

export function printGroupFilePreview(
  logger: CliLogger,
  args: {
    filePath: string;
    reportTotal: number;
    cnInTvNoReplacement: number;
    cnInTvCalls: readonly DomainCallExpression[];
    unwrapReplacementByCall: ReadonlyMap<DomainCallExpression, string>;
    sourceText: string;
    domainSf: DomainSourceFile;
    unwrapEdits: readonly GroupFileUnwrapPlan[];
    plannedGroupEdits: readonly PlannedGroupEdit[];
  },
): void {
  const { out } = logger;
  const {
    filePath,
    reportTotal,
    cnInTvNoReplacement,
    cnInTvCalls,
    unwrapReplacementByCall,
    sourceText,
    domainSf,
    unwrapEdits,
    plannedGroupEdits,
  } = args;

  let header = `\n── ${filePath} (${reportTotal} site(s)`;
  if (cnInTvNoReplacement > 0) {
    header += `; plus ${cnInTvNoReplacement} cn() inside tv left unchanged (0 args)`;
  }
  header += `) ──`;
  out(header);

  for (const call of cnInTvCalls) {
    const replacement = unwrapReplacementByCall.get(call);
    if (replacement === undefined) {
      out(`  Line ${lineOf(domainSf, call)} [tv \u2283 cn]: cn(...) has no arguments — skipped`);
      continue;
    }
    const start = call.pos;
    const end = call.end;
    if (sourceText.slice(start, end) === replacement) {
      continue;
    }
    out(`  Line ${lineOf(domainSf, call)} [tv \u2283 cn \u2192 string/array]:`);
    out(`  ${replacement.split("\n").join("\n  ")}`);
  }
  if (unwrapEdits.length > 0 && plannedGroupEdits.length > 0) {
    out(
      "  ([cn] / [tv] / [JSX className] lines below reflect content after unwrap of cn inside tv.)",
    );
  }
  for (const plan of plannedGroupEdits) {
    out(`  Line ${lineOf(plan.lineSf, plan.reportNode)} [${plan.label}]:`);
    out(`  ${plan.replacement.split("\n").join("\n  ")}`);
    out(`  // Buckets: ${JSON.stringify(plan.bucketSummary)}`);
  }
}

export function printGroupFilePreviewFromWork(logger: CliLogger, work: GroupFileWorkPlan): void {
  printGroupFilePreview(logger, {
    filePath: work.filePath,
    reportTotal: work.reportTotal,
    cnInTvNoReplacement: work.cnInTvNoReplacement,
    cnInTvCalls: work.cnInTvCalls,
    unwrapReplacementByCall: work.unwrapReplacementByCall,
    sourceText: work.sourceText,
    domainSf: work.domainSfForLineNumbers,
    unwrapEdits: work.unwrapEdits,
    plannedGroupEdits: work.plannedGroupEdits,
  });
}
