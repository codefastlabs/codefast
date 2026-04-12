import ts from "typescript";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import type {
  ArrangeGroupFileOptions,
  GroupFileResult,
  PlannedGroupEdit,
} from "#lib/arrange/types";
import {
  applyEditsDescending,
  buildKnownCnTvBindings,
  lineOf,
  unwrapCnInsideTvCallReplacement,
} from "#lib/arrange/ast/utils";
import { listAllCnCallsInsideTvInSourceFile } from "#lib/arrange/ast/collectors-tv";
import {
  collectGroupTargets,
  planGroupEditForTarget,
  targetReplaceStart,
} from "#lib/arrange/ast/targets";
import { ensureCnImport, sourceFileImportsCn } from "#lib/arrange/imports";

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
    if (sourceText.slice(start, end) === replacement) continue;
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
  }
}

function applyGroupFileWrites(
  filePath: string,
  options: ArrangeGroupFileOptions,
  fs: CliFs,
  sourceText: string,
  sf: ts.SourceFile,
  unwrapEdits: UnwrapPlan[],
  textAfterUnwrap: string,
  plannedGroupEdits: PlannedGroupEdit[],
  cnInTvNoReplacement: number,
): GroupFileResult {
  const originallyHasCnImport = sourceFileImportsCn(sf);

  const groupEdits = plannedGroupEdits.map((p) => ({
    start: p.start,
    end: p.end,
    replacement: p.replacement,
    jsxCn: p.jsxCn,
  }));

  const touchedJsxCn = groupEdits.some((e) => e.jsxCn);
  let newText =
    groupEdits.length > 0 ? applyEditsDescending(textAfterUnwrap, groupEdits) : textAfterUnwrap;

  const changed = unwrapEdits.length + groupEdits.length;

  if (changed > 0) {
    if (touchedJsxCn) {
      newText = ensureCnImport(newText, filePath, options.cnImport, originallyHasCnImport);
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
      if (replacement === undefined) return undefined;
      return { start: call.getStart(sf), end: call.getEnd(), replacement, call };
    })
    .filter((e): e is UnwrapPlan => e !== undefined);

  const unwrapReplacementByCall = new Map(unwrapPlans.map((p) => [p.call, p.replacement] as const));

  const unwrapEdits = unwrapPlans.filter((e) => sourceText.slice(e.start, e.end) !== e.replacement);

  const textAfterUnwrap =
    unwrapEdits.length > 0 ? applyEditsDescending(sourceText, unwrapEdits) : sourceText;

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
    (a, b) => targetReplaceStart(b) - targetReplaceStart(a),
  );
  const plannedGroupEdits: PlannedGroupEdit[] = [];
  for (const t of sortedTargets) {
    const plan = planGroupEditForTarget(t, textAfterUnwrap, options.withClassName);
    if (plan === undefined) continue;
    if (textAfterUnwrap.slice(plan.start, plan.end) === plan.replacement) continue;
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
    sourceText,
    sf,
    unwrapEdits,
    textAfterUnwrap,
    plannedGroupEdits,
    cnInTvNoReplacement,
  );
}
