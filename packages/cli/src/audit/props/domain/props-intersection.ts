/** Finds component props types joined with `&`, and judges each from what its parts resolved to. */

import { parseSync } from "oxc-parser";

import type { PropsViolation } from "#audit/domain/types";
import type { OxcNode } from "#core/oxc-node";
import { isOxcNode, programStatements } from "#core/oxc-node";
import { firstLineOf, lineOfOffset } from "#core/source-position";

/**
 * What the type checker resolved one part of an intersection to.
 *
 * @remarks Only an `object` part can be extended by an interface. A `union` part needs the `&` to
 * distribute over its members and a `type-parameter` part needs it to defer; an `other` part (a
 * primitive, a conditional) has no interface form; an `unresolved` part leaves the question open.
 */
export type ConstituentKind = "object" | "union" | "type-parameter" | "other" | "unresolved";

/**
 * One part of a props intersection: its UTF-16 source span and its text as written.
 */
export interface IntersectionPart {
  readonly start: number;
  readonly end: number;
  readonly text: string;
}

/**
 * A props type joined with `&`: a `*Props` alias, or the inline annotation of a component's props parameter.
 */
export interface PropsIntersection {
  /** Whether a `*Props` alias declares the intersection or a parameter annotation spells it inline. */
  readonly site: "alias" | "parameter";
  readonly line: number;
  /** The alias, or the parameter's annotation, as written up to its first line break. */
  readonly raw: string;
  /** The type the intersection is passed to, when it is not the alias's whole body. */
  readonly wrapper: string | undefined;
  readonly parts: ReadonlyArray<IntersectionPart>;
}

function unwrapParentheses(node: OxcNode): OxcNode {
  let current = node;
  while (current.type === "TSParenthesizedType" && isOxcNode(current.typeAnnotation)) {
    current = current.typeAnnotation;
  }
  return current;
}

function intersectionParts(sourceText: string, intersection: OxcNode): Array<IntersectionPart> {
  const types = Array.isArray(intersection.types) ? intersection.types.filter(isOxcNode) : [];
  return types.map(({ start, end }) => ({ start, end, text: sourceText.slice(start, end) }));
}

function typeArgumentsOf(reference: OxcNode): Array<OxcNode> {
  const typeArguments = reference.typeArguments;
  if (!isOxcNode(typeArguments) || !Array.isArray(typeArguments.params)) {
    return [];
  }
  return typeArguments.params.filter(isOxcNode).map(unwrapParentheses);
}

function intersectionsOfAlias(sourceText: string, alias: OxcNode): Array<PropsIntersection> {
  if (!isOxcNode(alias.id) || typeof alias.id.name !== "string" || !alias.id.name.endsWith("Props")) {
    return [];
  }
  if (!isOxcNode(alias.typeAnnotation)) {
    return [];
  }
  const base = {
    site: "alias" as const,
    line: lineOfOffset(sourceText, alias.start),
    raw: firstLineOf(sourceText.slice(alias.start, alias.end)),
  };
  const body = unwrapParentheses(alias.typeAnnotation);
  if (body.type === "TSIntersectionType") {
    return [{ ...base, wrapper: undefined, parts: intersectionParts(sourceText, body) }];
  }
  if (body.type !== "TSTypeReference" || !isOxcNode(body.typeName)) {
    return [];
  }
  const wrapper = sourceText.slice(body.typeName.start, body.typeName.end);
  return typeArgumentsOf(body)
    .filter((argument) => argument.type === "TSIntersectionType")
    .map((argument) => ({ ...base, wrapper, parts: intersectionParts(sourceText, argument) }));
}

const FUNCTION_DECLARATION_TYPES = new Set(["FunctionDeclaration", "TSDeclareFunction"]);

/** JSX renders a capitalised name as a component and a lowercase one as a host element. */
const COMPONENT_NAME = /^[A-Z]/;

function isComponentName(node: unknown): boolean {
  return isOxcNode(node) && typeof node.name === "string" && COMPONENT_NAME.test(node.name);
}

/** Returns the functions an initialiser is: itself, or each one passed to the call it is, such as `memo(…)`. */
function functionsOfExpression(expression: OxcNode): Array<OxcNode> {
  if (expression.type === "ParenthesizedExpression" && isOxcNode(expression.expression)) {
    return functionsOfExpression(expression.expression);
  }
  if (expression.type === "ArrowFunctionExpression" || expression.type === "FunctionExpression") {
    return [expression];
  }
  if (expression.type === "CallExpression" && Array.isArray(expression.arguments)) {
    return expression.arguments.filter(isOxcNode).flatMap(functionsOfExpression);
  }
  return [];
}

/**
 * Returns the components a top-level statement declares: a capitalised function, or the functions a
 * capitalised binding holds; a function nested in another is never one.
 */
function componentsOfStatement(statement: OxcNode): Array<OxcNode> {
  const declaration =
    (statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration") &&
    isOxcNode(statement.declaration)
      ? statement.declaration
      : statement;
  if (FUNCTION_DECLARATION_TYPES.has(declaration.type)) {
    return isComponentName(declaration.id) ? [declaration] : [];
  }
  if (declaration.type === "VariableDeclaration" && Array.isArray(declaration.declarations)) {
    return declaration.declarations
      .filter(isOxcNode)
      .flatMap(({ id, init }) => (isComponentName(id) && isOxcNode(init) ? functionsOfExpression(init) : []));
  }
  // `export default memo(function Row(…))` names the component on the function itself.
  return statement.type === "ExportDefaultDeclaration"
    ? functionsOfExpression(declaration).filter((fn) => isComponentName(fn.id))
    : [];
}

/** Returns the type annotating a function's first parameter, past a `this` parameter and a default value. */
function firstParameterAnnotation(fn: OxcNode): OxcNode | undefined {
  const params = Array.isArray(fn.params) ? fn.params.filter(isOxcNode) : [];
  const first = params.find((param) => !(param.type === "Identifier" && param.name === "this"));
  const binding = first?.type === "AssignmentPattern" && isOxcNode(first.left) ? first.left : first;
  const annotation = binding?.typeAnnotation;
  return isOxcNode(annotation) && isOxcNode(annotation.typeAnnotation) ? annotation.typeAnnotation : undefined;
}

function intersectionsOfParameter(sourceText: string, fn: OxcNode): Array<PropsIntersection> {
  const annotation = firstParameterAnnotation(fn);
  if (annotation === undefined) {
    return [];
  }
  const body = unwrapParentheses(annotation);
  if (body.type !== "TSIntersectionType") {
    return [];
  }
  return [
    {
      site: "parameter",
      line: lineOfOffset(sourceText, annotation.start),
      raw: firstLineOf(sourceText.slice(annotation.start, annotation.end)),
      wrapper: undefined,
      parts: intersectionParts(sourceText, body),
    },
  ];
}

function collectNodes(node: OxcNode, matches: (node: OxcNode) => boolean, found: Array<OxcNode>): void {
  if (matches(node)) {
    found.push(node);
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isOxcNode(item)) {
          collectNodes(item, matches, found);
        }
      }
    } else if (isOxcNode(value)) {
      collectNodes(value, matches, found);
    }
  }
}

/**
 * Finds every props type in one TypeScript source that joins types with `&`.
 *
 * @remarks A candidate is a `*Props` alias, or in a `.tsx` file a module-level component's first
 * parameter whose annotation is an intersection at its top level. Syntax alone decides the candidates;
 * whether an interface could express one is for the type checker, through {@link judgePropsIntersection}.
 */
export function findPropsIntersections(filePath: string, sourceText: string): Array<PropsIntersection> {
  const readsParameters = filePath.endsWith(".tsx");
  // Most files hold no props type with an `&`, so a text probe spares them the parse.
  if (!sourceText.includes("&") || (!readsParameters && !sourceText.includes("Props"))) {
    return [];
  }
  const { program } = parseSync(filePath, sourceText);
  const candidates: Array<OxcNode> = readsParameters ? programStatements(program).flatMap(componentsOfStatement) : [];
  if (isOxcNode(program)) {
    collectNodes(program, (node) => node.type === "TSTypeAliasDeclaration", candidates);
  }
  return candidates
    .toSorted((a, b) => a.start - b.start)
    .flatMap((node) =>
      node.type === "TSTypeAliasDeclaration"
        ? intersectionsOfAlias(sourceText, node)
        : intersectionsOfParameter(sourceText, node),
    );
}

function listParts(parts: ReadonlyArray<IntersectionPart>): string {
  return parts.map(({ text }) => `\`${firstLineOf(text)}\``).join(", ");
}

/**
 * Judges a props intersection from the kinds its parts resolved to, or returns `undefined` when it must stay.
 *
 * @remarks An intersection stays a `type` when any part is a union, a type parameter or not an
 * object; it is reported when an interface could extend every part, or when a part did not resolve.
 */
export function judgePropsIntersection(
  intersection: PropsIntersection,
  kinds: ReadonlyArray<ConstituentKind>,
): PropsViolation | undefined {
  const { site, line, raw, wrapper, parts } = intersection;
  const unresolved = parts.filter((_, index) => kinds[index] === "unresolved" || kinds[index] === undefined);
  if (unresolved.length > 0) {
    return {
      line,
      raw,
      reason: `${listParts(unresolved)} did not resolve to a type, so whether an interface can extend it is unknown — fix the type or build what it imports`,
    };
  }
  if (!kinds.every((kind) => kind === "object")) {
    return undefined;
  }
  const where = site === "parameter" ? " inline" : wrapper === undefined ? "" : ` passed to \`${wrapper}\``;
  const remedy = site === "parameter" ? "name it as an interface" : "declare an interface";
  return {
    line,
    raw,
    reason: `joins object types with \`&\`${where} — ${remedy} that extends them, so a conflicting member fails at the declaration instead of narrowing silently`,
  };
}
