/** Finds component props aliases joined with `&`, and judges each from what its parts resolved to. */

import { parseSync } from "oxc-parser";

import type { PropsViolation } from "#audit/domain/types";
import type { OxcNode } from "#core/oxc-node";
import { isOxcNode } from "#core/oxc-node";
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
 * A `*Props` type alias whose body joins types with `&`, at its top level or as an argument of the type it wraps.
 */
export interface PropsIntersection {
  readonly name: string;
  readonly line: number;
  /** The alias as written, up to its first line break. */
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
    name: alias.id.name,
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

function collectAliases(node: OxcNode, found: Array<OxcNode>): void {
  if (node.type === "TSTypeAliasDeclaration") {
    found.push(node);
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isOxcNode(item)) {
          collectAliases(item, found);
        }
      }
    } else if (isOxcNode(value)) {
      collectAliases(value, found);
    }
  }
}

/**
 * Finds every `*Props` type alias in one TypeScript source whose body joins types with `&`.
 *
 * @remarks Syntax alone decides which aliases are candidates; whether an interface could express
 * one is for the type checker, through {@link judgePropsIntersection}.
 */
export function findPropsIntersections(filePath: string, sourceText: string): Array<PropsIntersection> {
  // Most files declare no props alias with an `&`, so a text probe spares them the parse.
  if (!sourceText.includes("Props") || !sourceText.includes("&")) {
    return [];
  }
  const { program } = parseSync(filePath, sourceText);
  const aliases: Array<OxcNode> = [];
  if (isOxcNode(program)) {
    collectAliases(program, aliases);
  }
  return aliases.flatMap((alias) => intersectionsOfAlias(sourceText, alias));
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
  const { line, raw, wrapper, parts } = intersection;
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
  const where = wrapper === undefined ? "" : ` passed to \`${wrapper}\``;
  return {
    line,
    raw,
    reason: `joins object types with \`&\`${where} — declare an interface that extends them, so a conflicting member fails at the declaration instead of narrowing silently`,
  };
}
