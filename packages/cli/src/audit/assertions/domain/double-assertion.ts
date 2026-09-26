import type { Comment } from "oxc-parser";
import { parseSync } from "oxc-parser";

import type { AssertionViolation } from "#audit/domain/types";
import type { OxcNode } from "#core/oxc-node";
import { isOxcNode } from "#core/oxc-node";
import { firstLineOf, lineOfOffset } from "#core/source-position";

/**
 * The comment that keeps one double assertion, with the reason it has to stay.
 *
 * @remarks It covers an assertion on its own line or the line below it, and must carry a reason
 * after the colon; one that covers nothing is reported, so a kept assertion cannot outlive its cause.
 *
 * @since 0.13.0
 */
export const DOUBLE_ASSERTION_DIRECTIVE = "codefast-allow-double-assertion";

const DOUBLE_ASSERTION_REASON =
  "double assertion through `unknown`/`any` — make the types agree, narrow with a type guard, or keep it " +
  `with // ${DOUBLE_ASSERTION_DIRECTIVE}: <reason>`;

// Most files hold neither, so a text probe spares them the parse.
const CANDIDATE_TEXT = new RegExp(`\\bas\\s+(?:unknown|any)\\b|<(?:unknown|any)>|${DOUBLE_ASSERTION_DIRECTIVE}`);

interface Directive {
  readonly line: number;
  readonly raw: string;
  readonly reason: string;
  isUsed: boolean;
}

function isAssertion(node: OxcNode): boolean {
  return node.type === "TSAsExpression" || node.type === "TSTypeAssertion";
}

/** The assertion an outer one wraps, through any parentheses, when it erases to `unknown` or `any`. */
function erasingInnerAssertion(outer: OxcNode): OxcNode | undefined {
  let inner = outer.expression;
  while (isOxcNode(inner) && inner.type === "ParenthesizedExpression") {
    inner = inner.expression;
  }
  if (!isOxcNode(inner) || !isAssertion(inner) || !isOxcNode(inner.typeAnnotation)) {
    return undefined;
  }
  const erasedTo = inner.typeAnnotation.type;
  return erasedTo === "TSUnknownKeyword" || erasedTo === "TSAnyKeyword" ? inner : undefined;
}

function collectDoubleAssertions(node: OxcNode, found: Array<OxcNode>): void {
  let next: OxcNode = node;
  if (isAssertion(node)) {
    const inner = erasingInnerAssertion(node);
    if (inner !== undefined) {
      found.push(node);
      // The erased pair is one finding; what it wraps is walked on its own.
      next = inner;
    }
  }
  for (const value of Object.values(next)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isOxcNode(item)) {
          collectDoubleAssertions(item, found);
        }
      }
    } else if (isOxcNode(value)) {
      collectDoubleAssertions(value, found);
    }
  }
}

function parseDirective(sourceText: string, comment: Comment): Directive | undefined {
  if (comment.type !== "Line") {
    return undefined;
  }
  const text = comment.value.trim();
  if (!text.startsWith(DOUBLE_ASSERTION_DIRECTIVE)) {
    return undefined;
  }
  const reason = /^:\s*(\S.*)$/.exec(text.slice(DOUBLE_ASSERTION_DIRECTIVE.length))?.[1] ?? "";
  return {
    line: lineOfOffset(sourceText, comment.start),
    raw: sourceText.slice(comment.start, comment.end),
    reason,
    isUsed: false,
  };
}

/**
 * Scans one TypeScript source for double assertions through `unknown` or `any`, and for directives
 * that keep none or give no reason.
 *
 * @remarks `x as unknown as T`, `(x as unknown) as T` and `<T><unknown>x` are one shape: the
 * compiler found the two types unrelated, and the pair silences it instead of reconciling them.
 *
 * @since 0.13.0
 */
export function auditDoubleAssertionSource(filePath: string, sourceText: string): Array<AssertionViolation> {
  if (!CANDIDATE_TEXT.test(sourceText)) {
    return [];
  }
  const { program, comments } = parseSync(filePath, sourceText);
  const directives = comments.map((comment) => parseDirective(sourceText, comment)).filter((d) => d !== undefined);
  const found: Array<OxcNode> = [];
  if (isOxcNode(program)) {
    collectDoubleAssertions(program, found);
  }

  const violations: Array<AssertionViolation> = [];
  for (const assertion of found) {
    const line = lineOfOffset(sourceText, assertion.start);
    const directive = directives.find(
      (candidate) => candidate.reason !== "" && (candidate.line === line || candidate.line === line - 1),
    );
    if (directive !== undefined) {
      directive.isUsed = true;
      continue;
    }
    violations.push({
      line,
      raw: firstLineOf(sourceText.slice(assertion.start, assertion.end)),
      reason: DOUBLE_ASSERTION_REASON,
    });
  }
  for (const directive of directives) {
    if (directive.reason === "") {
      violations.push({
        line: directive.line,
        raw: directive.raw,
        reason: `a ${DOUBLE_ASSERTION_DIRECTIVE} directive states why after a colon`,
      });
    } else if (!directive.isUsed) {
      violations.push({
        line: directive.line,
        raw: directive.raw,
        reason: `this ${DOUBLE_ASSERTION_DIRECTIVE} directive keeps no double assertion — remove it`,
      });
    }
  }

  violations.sort((a, b) => a.line - b.line);
  return violations;
}
