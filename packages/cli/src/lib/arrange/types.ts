/**
 * Shared types for the arrange pipeline (Tailwind `cn()` / `tv()` tooling).
 *
 * Buckets follow a **render-pipeline order** (existence → … → conditions), aligned
 * with Tailwind v4 utility groupings.
 */

import type ts from "typescript";
import type { CodefastArrangeConfig } from "#lib/config/schema";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";

export type Bucket =
  | "existence"
  | "position"
  | "layout"
  | "sizing"
  | "spacing"
  | "shape"
  | "background"
  | "shadow"
  | "typography"
  | "composite"
  | "motion"
  | "starting"
  | "behavior"
  /** Selector variants (e.g. `[&…]:`, `*:`, `has-*`) distinct from interactive/data state. */
  | "selector"
  | "state"
  | "arbitrary"
  | "other";

/** String or no-substitution template literal used as a Tailwind class blob. */
export type TailwindClassLiteral = ts.StringLiteral | ts.NoSubstitutionTemplateLiteral;

export type ForEachStringLiteralInClassExpressionOptions = {
  /**
   * When `false`, do not visit literals inside `cond ? "a" : "b"`. Used when
   * building the cn/tv **apply** pool so mutually exclusive branch classes are
   * never merged into one static string (while `analyze` still uses the default).
   */
  descendIntoConditional?: boolean;
};

export type JsxClassNameStatic = {
  lit: TailwindClassLiteral;
  /** Replace this node: `StringLiteral` or whole `JsxExpression`. */
  valueNode: ts.Node;
};

/**
 * A StringNode represents a single "grouping slot" — the full set of static
 * string literals that belong to one logical class surface.
 */
export type StringNode = {
  /** All static string literals belonging to this slot, in source order. */
  nodes: TailwindClassLiteral[];
  sf: ts.SourceFile;
  /** String slots in `tv({ ... })` that are not `cn(...)` arguments — use `formatArray`. */
  isTvContext: boolean;
  /** When set, the entire cn(...) call is replaced at once. */
  cnCall?: ts.CallExpression;
  /** First literal in the slot; used for positions and line-number reporting. */
  get primaryClassLiteral(): TailwindClassLiteral;
};

export type GroupTarget =
  | { kind: "cnArg"; item: StringNode }
  | {
      kind: "jsxClassName";
      sf: ts.SourceFile;
      lit: TailwindClassLiteral;
      valueNode: ts.Node;
    };

export type PlannedGroupEdit = {
  start: number;
  end: number;
  replacement: string;
  /** Per-chunk bucket labels (same as `arrange group` trailing `// Buckets:` line). */
  bucketSummary: string[];
  jsxCn: boolean;
  lineSf: ts.SourceFile;
  reportNode: ts.Node;
  label: string;
};

export type AnalyzeReport = {
  files: number;
  cnCallExpressions: number;
  tvCallExpressions: number;
  cnInsideTvCalls: Array<{
    file: string;
    line: number;
    argCount: number;
    preview: string;
  }>;
  longCnStringLiterals: Array<{
    file: string;
    line: number;
    tokenCount: number;
    preview: string;
  }>;
  longTvStringLiterals: Array<{
    file: string;
    line: number;
    tokenCount: number;
    preview: string;
  }>;
  longJsxClassNameLiterals: Array<{
    file: string;
    line: number;
    tokenCount: number;
    preview: string;
  }>;
};

export type GroupFileResult = {
  filePath: string;
  /**
   * Sites worth human review: applied edits plus `cn()` inside `tv` with no args
   * (skipped). Matches preview totals when `groupEdits` correspond to the same plan.
   */
  totalFound: number;
  /** Edits actually written in apply mode; always 0 in preview mode. */
  changed: number;
};

export type ArrangeGroupFileOptions = {
  write: boolean;
  withClassName: boolean;
  cnImport?: string;
};

export type ArrangeRunOnTargetOptions = ArrangeGroupFileOptions;

export type ArrangeRunResult = {
  filePaths: string[];
  modifiedFiles: string[];
  totalFound: number;
  totalChanged: number;
};

/** Command-orchestrated arrange run: config is injected at the CLI boundary (no filesystem config reads in core). */
export type ArrangeSyncOptions = {
  rootDir: string;
  config?: CodefastArrangeConfig;
  targetPath: string;
  write: boolean;
  withClassName?: boolean;
  cnImport?: string;
  fs?: CliFs;
  logger?: CliLogger;
};
