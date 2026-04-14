import ts from "typescript";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import type {
  ArrangeGroupFileOptions,
  GroupFileResult,
  PlannedGroupEdit,
} from "#lib/arrange/domain/types";
import {
  applyEditsDescending,
  buildKnownCnTvBindings,
  lineOf,
  unwrapCnInsideTvCallReplacement,
} from "#lib/arrange/domain/ast/ast-helpers";
import { listAllCnCallsInsideTvInSourceFile } from "#lib/arrange/domain/ast/collectors-tv";
import {
  collectGroupTargets,
  planGroupEditForTarget,
  targetReplaceStart,
} from "#lib/arrange/domain/ast/targets";
import { ensureCnImport } from "#lib/arrange/domain/imports";

type UnwrapPlan = {
  start: number;
  end: number;
  replacement: string;
  call: ts.CallExpression;
};

function printGroupFilePreview(
  logger: CliLogger,
  args: {
    filePath: string;
    reportTotal: number;
    cnInTvNoReplacement: number;
    cnInTvCalls: ts.CallExpression[];
    unwrapReplacementByCall: ReadonlyMap<ts.CallExpression, string>;
    sourceText: string;
    sf: ts.SourceFile;
    unwrapEdits: UnwrapPlan[];
    plannedGroupEdits: PlannedGroupEdit[];
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
    sf,
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
      out(`  Line ${lineOf(sf, call)} [tv ⊃ cn]: cn(...) has no arguments — skipped`);
      continue;
    }
    const start = call.getStart(sf);
    const end = call.getEnd();
    if (sourceText.slice(start, end) === replacement) {
      continue;
    }
    out(`  Line ${lineOf(sf, call)} [tv ⊃ cn → string/array]:`);
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

function applyGroupFileWrites(
  filePath: string,
  options: ArrangeGroupFileOptions,
  fs: CliFs,
  logger: CliLogger,
  unwrapEdits: UnwrapPlan[],
  textAfterUnwrap: string,
  plannedGroupEdits: PlannedGroupEdit[],
  cnInTvNoReplacement: number,
): GroupFileResult {
  const groupEdits = plannedGroupEdits.map((plannedEdit) => ({
    start: plannedEdit.start,
    end: plannedEdit.end,
    replacement: plannedEdit.replacement,
    jsxCn: plannedEdit.jsxCn,
  }));

  const touchedJsxCn = groupEdits.some((groupEdit) => groupEdit.jsxCn);
  let newText =
    groupEdits.length > 0 ? applyEditsDescending(textAfterUnwrap, groupEdits) : textAfterUnwrap;

  const changed = unwrapEdits.length + groupEdits.length;

  if (changed > 0) {
    if (touchedJsxCn) {
      newText = ensureCnImport(newText, filePath, options.cnImport);
    }
    fs.writeFileSync(filePath, newText, "utf8");
  }

  return { filePath, totalFound: changed + cnInTvNoReplacement, changed };
}

export function groupFile(
  filePath: string,
  options: ArrangeGroupFileOptions,
  fs: CliFs,
  logger: CliLogger,
): GroupFileResult {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const knownBindings = buildKnownCnTvBindings(sf);
  const cnInTvCalls = listAllCnCallsInsideTvInSourceFile(sf, knownBindings);

  const unwrapPlans = cnInTvCalls
    .map((call): UnwrapPlan | undefined => {
      const replacement = unwrapCnInsideTvCallReplacement(call, sourceText, sf);
      if (replacement === undefined) {
        return undefined;
      }
      return { start: call.getStart(sf), end: call.getEnd(), replacement, call };
    })
    .filter((planOrUndefined): planOrUndefined is UnwrapPlan => planOrUndefined !== undefined);

  const unwrapReplacementByCall = new Map(
    unwrapPlans.map((unwrapPlan) => [unwrapPlan.call, unwrapPlan.replacement] as const),
  );

  const unwrapEdits = unwrapPlans.filter(
    (unwrapPlan) => sourceText.slice(unwrapPlan.start, unwrapPlan.end) !== unwrapPlan.replacement,
  );

  const textAfterUnwrap =
    unwrapEdits.length > 0 ? applyEditsDescending(sourceText, unwrapEdits) : sourceText;

  // The first parse (`sf`) intentionally targets the original source text to discover unwrap edits.
  // After `applyEditsDescending` runs, TypeScript source spans from that AST no longer match the updated text.
  // Re-parse `textAfterUnwrap` so group-target traversal uses valid positions; reusing the first AST
  // would produce incorrect start/end offsets for subsequent grouping edits.
  const sfGrouped = ts.createSourceFile(
    filePath,
    textAfterUnwrap,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const groupTargets = collectGroupTargets(sfGrouped, filePath);
  const cnInTvNoReplacement = cnInTvCalls.length - unwrapPlans.length;

  const sortedTargets = [...groupTargets].sort(
    (leftTarget, rightTarget) => targetReplaceStart(rightTarget) - targetReplaceStart(leftTarget),
  );
  const plannedGroupEdits: PlannedGroupEdit[] = [];
  for (const groupTarget of sortedTargets) {
    const plan = planGroupEditForTarget(groupTarget, textAfterUnwrap, options.withClassName);
    if (plan === undefined) {
      continue;
    }
    if (textAfterUnwrap.slice(plan.start, plan.end) === plan.replacement) {
      continue;
    }
    plannedGroupEdits.push(plan);
  }

  const editSitesCount = unwrapEdits.length + plannedGroupEdits.length;
  const reportTotal = editSitesCount + cnInTvNoReplacement;

  if (cnInTvCalls.length === 0 && groupTargets.length === 0) {
    return { filePath, totalFound: 0, changed: 0 };
  }

  if (!options.write) {
    if (editSitesCount === 0 && cnInTvNoReplacement === 0) {
      return { filePath, totalFound: 0, changed: 0 };
    }

    printGroupFilePreview(logger, {
      filePath,
      reportTotal,
      cnInTvNoReplacement,
      cnInTvCalls,
      unwrapReplacementByCall,
      sourceText,
      sf,
      unwrapEdits,
      plannedGroupEdits,
    });
    return {
      filePath,
      totalFound: reportTotal,
      changed: 0,
    };
  }

  return applyGroupFileWrites(
    filePath,
    options,
    fs,
    logger,
    unwrapEdits,
    textAfterUnwrap,
    plannedGroupEdits,
    cnInTvNoReplacement,
  );
}
