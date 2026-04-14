/**
 * Analyze and suggest Tailwind class grouping inside `cn(...)` / `tv(...)`.
 *
 * Detects literals in cn arguments: direct strings, ternaries, arrays, string concatenation.
 * tv: compoundVariants[].className / class; nested cn literals use the same rules.
 * Direct `cn(...)` inside tv config is discouraged — analyze/preview/apply may replace it with
 * a string (one argument) or an array (≥2 arguments). Literals in bare tv arrays are not split
 * by apply (avoids `[ [` artifacts).
 *
 * Tailwind CSS v4-oriented heuristics (class buckets follow **render-pipeline order**):
 *   existence → position → layout → sizing → spacing → shape → background → shadow
 *   → typography → composite → motion → starting → behavior → state (variants) → selector variants.
 *   - Container queries (@min-* / @max-* / @[…] / @sm / @md / @3xl / @max-3xs, md/sidebar:, …)
 *   - Logical properties (ps/pe/ms/me/start/end)
 *   - not-* modifier; has-*; in-[…]; * / **; nth-* (including numeric); media (pointer-*, contrast-* …)
 *   - Newer utilities: inset-shadow, field-sizing, mask-*, text-shadow-*, scheme-*, …
 *   - Arbitrary variants [&...] in general forms
 *
 * Usage (repo root):
 *   pnpm cli:arrange-analyze [dir|file]
 *   pnpm exec codefast arrange analyze [dir|file]
 *   pnpm exec codefast arrange group flex gap-2 rounded-md border px-3
 *   pnpm exec codefast arrange group -- … --tv
 */

export { analyzeDirectory } from "#lib/arrange/application/analyze";
export { printAnalyzeReport } from "#lib/arrange/presentation/report";
export { groupFile } from "#lib/arrange/application/group-file";
export { runOnTarget, runArrangeSync } from "#lib/arrange/application/run-target";
export { createNodeCliFs, createNodeCliLogger } from "#lib/infra/node-io";
export { domainSourceParserAdapter } from "#lib/arrange/infra/domain-source-parser.adapter";
export { ArrangeError, ArrangeErrorCode } from "#lib/arrange/domain/errors";
export type { CliFs, CliLogger } from "#lib/core/application/ports/cli-io.port";
export type {
  AnalyzeReport,
  ArrangeGroupFileOptions,
  ArrangeRunResult,
  ArrangeRunOnTargetOptions,
  Bucket,
  ForEachStringLiteralInClassExpressionOptions,
  GroupFileResult,
} from "#lib/arrange/domain/types";
export type { ArrangeSyncOptions } from "#lib/arrange/infra/arrange-sync-cli-options";

export {
  DEFAULT_ARRANGE_TARGET,
  LONG_STRING_TOKEN_THRESHOLD,
  MAX_STRIP_VARIANT_PASSES,
} from "#lib/arrange/domain/constants";
export { cnModuleSpecifierForFile } from "#lib/arrange/domain/imports";
export { ensureCnImport } from "#lib/arrange/infra/ensure-cn-import";
export {
  areCnTailwindPartitionsEquivalent,
  capGroups,
  mergeEaseTimingIntoFollowingAnimatedState,
  mergeSingletons,
  suggestCnGroups,
  summarizeGroupBucketLabels,
} from "#lib/arrange/domain/grouping";
export {
  classifyToken,
  indexOfFirstVariantColon,
  stripVariants,
  tokenizeClassString,
  bucketsCompatible,
  bucketsMergeCompatible,
  selectorKey,
  stateKey,
} from "#lib/arrange/domain/tokenizer";

export { forEachStringLiteralInClassExpression } from "#lib/arrange/domain/ast/collectors-cn";
export { mergeCnUnconditionalLiteralPoolForTest } from "#lib/arrange/infra/merge-cn-literal-pool-for-test";
export {
  applyEditsDescending,
  buildKnownCnTvBindings,
  indentOfLineContaining,
  isCnOrTvIdentifier,
  KNOWN_CN_TV_MODULES,
  lineOf,
  moduleLooksLikeCnTvReexport,
  unwrapCnInsideTvCallReplacement,
} from "#lib/arrange/domain/ast/ast-helpers";

export {
  escapeTsStringLiteralContent,
  formatArray,
  formatCnArguments,
  formatCnCall,
  formatJsxCnAttributeValue,
} from "#lib/arrange/domain/source-text-formatters";

export { DEFAULT_SKIP_DIRS, walkTsxFiles } from "#lib/shared/source-code/infra/tsx-file-walk";
