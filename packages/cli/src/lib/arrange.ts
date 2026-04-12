/**
 * Phân tích và gợi ý phân nhóm chuỗi Tailwind trong `cn(...)` / `tv(...)`.
 *
 * Phát hiện literal trong đối số cn: chuỗi trực tiếp, ternary, mảng, nối chuỗi +.
 * tv: compoundVariants[].className / class; literal trong cn lồng dùng cùng quy tắc.
 * `cn(...)` trực tiếp trong cấu hình tv không khuyến nghị — analyze/preview/apply có thể
 * thay bằng chuỗi (1 đối số) hoặc mảng (≥2 đối số). Literal trong mảng tv trực tiếp
 * không tách bằng apply (tránh `[ [`).
 *
 * Hỗ trợ Tailwind CSS v4 đầy đủ:
 *   - Container queries (@min-* / @max-* / @sm / @md / @3xl / @max-3xs …)
 *   - Logical properties (ps/pe/ms/me/start/end)
 *   - not-* modifier; has-*; in-[…]; * / **; nth-* (kể cả số); media (pointer-*, contrast-* …)
 *   - Utilities mới: inset-shadow, field-sizing, mask-*, wrap-*, text-shadow-*, scheme-*, …
 *   - Arbitrary variants [&...] mọi dạng
 *
 * Usage (repo root):
 *   pnpm cli:arrange-analyze [dir|file]
 *   pnpm exec codefast arrange analyze [dir|file]
 *   pnpm exec codefast arrange group flex gap-2 rounded-md border px-3
 *   pnpm exec codefast arrange group -- … --tv
 */

export { analyzeDirectory } from "#lib/arrange/analyze";
export { printAnalyzeReport } from "#lib/arrange/report";
export { groupFile } from "#lib/arrange/group-file";
export { runOnTarget } from "#lib/arrange/run-target";
export {
  createNodeCliFs,
  createNodeCliLogger,
  createNodeCliFs as createNodeArrangeFs,
  createNodeCliLogger as createNodeArrangeLogger,
} from "#lib/infra/node-io";
export { ArrangeError, ArrangeErrorCode } from "#lib/arrange/errors";
export type { CliFs, CliLogger } from "#lib/infra/fs-contract";
/** @deprecated Use {@link CliFs} */
export type { CliFs as ArrangeFs } from "#lib/infra/fs-contract";
/** @deprecated Use {@link CliLogger} */
export type { CliLogger as ArrangeLogger } from "#lib/infra/fs-contract";
export type {
  AnalyzeReport,
  ArrangeGroupFileOptions,
  ArrangeRunOnTargetOptions,
  Bucket,
  ForEachStringLiteralInClassExpressionOptions,
  GroupFileResult,
} from "#lib/arrange/types";

export { DEFAULT_ARRANGE_TARGET, LONG_STRING_TOKEN_THRESHOLD } from "#lib/arrange/constants";
export {
  areCnTailwindPartitionsEquivalent,
  capGroups,
  mergeSingletons,
  suggestCnGroups,
} from "#lib/arrange/grouping";
export {
  classifyToken,
  stripVariants,
  tokenizeClassString,
  bucketsCompatible,
  bucketsMergeCompatible,
  stateKey,
} from "#lib/arrange/tokenizer";

export {
  forEachStringLiteralInClassExpression,
  mergeCnUnconditionalLiteralPoolForTest,
} from "#lib/arrange/ast/collectors";
export {
  applyEditsDescending,
  buildKnownCnTvBindings,
  isCnOrTvIdentifier,
  KNOWN_CN_TV_MODULES,
  lineOf,
  moduleLooksLikeCnTvReexport,
  unwrapCnInsideTvCallReplacement,
} from "#lib/arrange/ast/utils";

export {
  escapeTsStringLiteralContent,
  formatArray,
  formatCnArguments,
  formatCnCall,
  formatJsxCnAttributeValue,
} from "#lib/arrange/formatters";

export { walkTsxFiles } from "#lib/arrange/walk";
