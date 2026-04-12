import ts from "typescript";
import type { ArrangeFs, ArrangeLogger } from "#lib/arrange/fs-contract";
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
import { listAllCnCallsInsideTvInSourceFile } from "#lib/arrange/ast/collectors";
import {
  collectGroupTargets,
  planGroupEditForTarget,
  targetReplaceStart,
} from "#lib/arrange/ast/targets";
import { ensureCnImport, sourceFileImportsCn } from "#lib/arrange/imports";

export function groupFile(
  filePath: string,
  options: ArrangeGroupFileOptions,
  fs: ArrangeFs,
  logger: ArrangeLogger,
): GroupFileResult {
  const { out } = logger;
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

  type UnwrapPlan = { start: number; end: number; replacement: string; call: ts.CallExpression };
  const unwrapPlans = cnInTvCalls
    .map((call): UnwrapPlan | undefined => {
      const replacement = unwrapCnInsideTvCallReplacement(call, sourceText, sf);
      if (replacement === undefined) return undefined;
      return { start: call.getStart(sf), end: call.getEnd(), replacement, call };
    })
    .filter((e): e is UnwrapPlan => e !== undefined);

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
  const cnInTvZeroArgCount = cnInTvCalls.filter(
    (call) => unwrapCnInsideTvCallReplacement(call, sourceText, sf) === undefined,
  ).length;
  const reportTotal = editSitesCount + cnInTvZeroArgCount;

  if (cnInTvCalls.length === 0 && groupTargets.length === 0) {
    return { filePath, totalFound: 0, changed: 0 };
  }

  if (!options.write) {
    if (editSitesCount === 0 && cnInTvZeroArgCount === 0) {
      return { filePath, totalFound: 0, changed: 0 };
    }

    let header = `\n── ${filePath} (${reportTotal} vị trí`;
    if (cnInTvNoReplacement > 0) {
      header += `; thêm ${cnInTvNoReplacement} cn() trong tv không đổi (0 đối số)`;
    }
    header += `) ──`;
    out(header);

    for (const call of cnInTvCalls) {
      const replacement = unwrapCnInsideTvCallReplacement(call, sourceText, sf);
      if (replacement === undefined) {
        out(`  Dòng ${lineOf(sf, call)} [tv ⊃ cn]: cn(...) không có đối số — bỏ qua`);
        continue;
      }
      const start = call.getStart(sf);
      const end = call.getEnd();
      if (sourceText.slice(start, end) === replacement) continue;
      out(`  Dòng ${lineOf(sf, call)} [tv ⊃ cn → chuỗi/mảng]:`);
      out(`  ${replacement.split("\n").join("\n  ")}`);
    }
    if (unwrapEdits.length > 0 && plannedGroupEdits.length > 0) {
      out(
        "  (Các dòng [cn] / [tv] / [JSX className] bên dưới theo nội dung sau bước unwrap cn trong tv.)",
      );
    }
    for (const plan of plannedGroupEdits) {
      out(`  Dòng ${lineOf(plan.lineSf, plan.reportNode)} [${plan.label}]:`);
      out(`  ${plan.replacement.split("\n").join("\n  ")}`);
    }
    return {
      filePath,
      totalFound: reportTotal,
      changed: 0,
    };
  }

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

  return { filePath, totalFound: changed + cnInTvZeroArgCount, changed };
}
