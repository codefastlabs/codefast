/**
 * Shared types for the arrange pipeline (Tailwind `cn()` / `tv()` tooling).
 *
 * **Render Pipeline Order** (see `packages/cli/README.md`): Existence → Position → Layout
 * → Sizing → Spacing → Shape → Background → Shadow → Typography → Composite → Motion
 * → Starting → Behavior → State → Selector.
 *
 * `arbitrary` and `other` are non-pipeline tails for `[prop:value]` syntax and unknown utilities.
 */

import type {
  DomainAstNode,
  DomainCallExpression,
  DomainSourceFile,
  DomainTailwindClassLiteral,
} from "#/arrange/domain/ast/ast-node";
import type { CodefastConfig } from "#/core/config/schema";
import type { GroupFileWorkPlan } from "#/arrange/domain/grouping-service";

/**
 * @since 0.3.16-canary.0
 */
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
  | "state"
  /**
   * Selector variants (e.g. `[&…]:`, `*:`, `has-*`) distinct from interactive/data state.
   */
  | "selector"
  | "arbitrary"
  | "other";

/**
 * String or no-substitution template literal used as a Tailwind class blob.
 *
 * @since 0.3.16-canary.0
 */
export type TailwindClassLiteral = DomainTailwindClassLiteral;

/**
 * @since 0.3.16-canary.0
 */
export type ForEachStringLiteralInClassExpressionOptions = {
  /**
   * When `false`, do not visit literals inside `cond ? "a" : "b"`. Used when
   * building the cn/tv **apply** pool so mutually exclusive branch classes are
   * never merged into one static string (while `analyze` still uses the default).
   */
  descendIntoConditional?: boolean;
};

/**
 * @since 0.3.16-canary.0
 */
export type JsxClassNameStatic = {
  lit: TailwindClassLiteral;
  /**
   * Replace this node: `StringLiteral` or whole `JsxExpression`.
   */
  valueNode: DomainAstNode;
};

/**
 * A StringNode represents a single "grouping slot" — the full set of static
 * string literals that belong to one logical class surface.
 *
 * @since 0.3.16-canary.0
 */
export type StringNode = {
  /**
   * All static string literals belonging to this slot, in source order.
   */
  nodes: Array<TailwindClassLiteral>;
  sf: DomainSourceFile;
  /**
   * String slots in `tv({ ... })` that are not `cn(...)` arguments — use `formatArray` when
   * replacing a whole array, or `formatArrayElementsAsSiblingLines` when replacing one element
   * inside an existing array.
   */
  isTvContext: boolean;
  /**
   * When set, the entire cn(...) call is replaced at once.
   */
  cnCall?: DomainCallExpression;
  /**
   * First literal in the slot; used for positions and line-number reporting.
   */
  get primaryClassLiteral(): TailwindClassLiteral;
};

/**
 * @since 0.3.16-canary.0
 */
export type GroupTarget =
  | { kind: "cnArg"; item: StringNode }
  | {
      kind: "jsxClassName";
      sf: DomainSourceFile;
      lit: TailwindClassLiteral;
      valueNode: DomainAstNode;
    };

/**
 * @since 0.3.16-canary.0
 */
export type PlannedGroupEdit = {
  start: number;
  end: number;
  replacement: string;
  /**
   * Per-chunk bucket labels (same as `arrange group` trailing `// Buckets:` line).
   */
  bucketSummary: Array<string>;
  jsxCn: boolean;
  lineSf: DomainSourceFile;
  reportNode: DomainAstNode;
  label: string;
};

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
export type GroupFileResult = {
  filePath: string;
  /**
   * Sites worth human review: applied edits plus `cn()` inside `tv` with no args
   * (skipped). Matches preview totals when `groupEdits` correspond to the same plan.
   */
  totalFound: number;
  /**
   * Edits actually written in apply mode; always 0 in preview mode.
   */
  changed: number;
  /** Populated only in preview mode (write=false) when edits exist. */
  workPlan?: GroupFileWorkPlan;
};

/**
 * @since 0.3.16-canary.0
 */
export type ArrangeGroupFileOptions = {
  write: boolean;
  withClassName: boolean;
  cnImport?: string;
};

/**
 * @since 0.3.16-canary.0
 */
export type ArrangeRunResult = {
  filePaths: Array<string>;
  modifiedFiles: Array<string>;
  totalFound: number;
  totalChanged: number;
  hookError: string | null;
  /** Populated in preview mode (write=false); empty in apply mode. */
  previewPlans: Array<GroupFileWorkPlan>;
};

/**
 * @since 0.3.16-canary.0
 */
export type ArrangeSuggestGroupsOutput = {
  readonly primaryLine: string;
  readonly bucketsCommentLine: string;
};

/**
 * @since 0.3.16-canary.0
 */
export type ArrangeTargetWorkspaceAndConfig = {
  readonly resolvedTarget: string;
  readonly rootDir: string;
  readonly config: CodefastConfig;
};
