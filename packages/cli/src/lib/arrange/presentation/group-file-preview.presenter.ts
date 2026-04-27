import { inject, injectable } from "@codefast/di";
import type { CliLogger } from "#/lib/core/application/ports/cli-io.port";
import type { GroupFilePreviewPort } from "#/lib/arrange/application/ports/group-file-preview.port";
import type {
  GroupFileUnwrapPlan,
  GroupFileWorkPlan,
} from "#/lib/arrange/domain/arrange-grouping.service";
import { lineOf } from "#/lib/arrange/domain/ast/ast-helpers.helper";
import type {
  DomainCallExpression,
  DomainSourceFile,
} from "#/lib/arrange/domain/ast/ast-node.model";
import type { PlannedGroupEdit } from "#/lib/arrange/domain/types.domain";
import { CliLoggerToken } from "#/lib/core/contracts/tokens";

function printGroupFilePreview(
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
  logger.out(header);

  for (const call of cnInTvCalls) {
    const replacement = unwrapReplacementByCall.get(call);
    if (replacement === undefined) {
      logger.out(`  Line ${lineOf(domainSf, call)} [tv ⊃ cn]: cn(...) has no arguments — skipped`);
      continue;
    }
    const start = call.pos;
    const end = call.end;
    if (sourceText.slice(start, end) === replacement) {
      continue;
    }
    logger.out(`  Line ${lineOf(domainSf, call)} [tv ⊃ cn → string/array]:`);
    logger.out(`  ${replacement.split("\n").join("\n  ")}`);
  }
  if (unwrapEdits.length > 0 && plannedGroupEdits.length > 0) {
    logger.out(
      "  ([cn] / [tv] / [JSX className] lines below reflect content after unwrap of cn inside tv.)",
    );
  }
  for (const plan of plannedGroupEdits) {
    logger.out(`  Line ${lineOf(plan.lineSf, plan.reportNode)} [${plan.label}]:`);
    logger.out(`  ${plan.replacement.split("\n").join("\n  ")}`);
    logger.out(`  // Buckets: ${JSON.stringify(plan.bucketSummary)}`);
  }
}

function printGroupFilePreviewFromWork(logger: CliLogger, work: GroupFileWorkPlan): void {
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

@injectable([inject(CliLoggerToken)])
export class GroupFilePreviewPresenterAdapter implements GroupFilePreviewPort {
  constructor(private readonly logger: CliLogger) {}

  printGroupFilePreviewFromWork(work: GroupFileWorkPlan): void {
    printGroupFilePreviewFromWork(this.logger, work);
  }
}
