import ts from "typescript";
import { APPLY_MIN_TOKENS, MAX_OBJECT_DEPTH } from "#lib/arrange/constants";
import {
  CN_APPLY_LITERAL_WALK_OPTS,
  collectUnconditionalTailwindLiteralsFromCnArguments,
  forEachStringLiteralInClassExpression,
  isUnsafeLiteralForCnStyleApplySplit,
} from "#lib/arrange/ast/collectors-cn";
import type { StringNode, TailwindClassLiteral } from "#lib/arrange/types";
import { tokenizeClassString } from "#lib/arrange/tokenizer";
import {
  buildKnownCnTvBindings,
  isCnOrTvIdentifier,
  propertyAssignmentNameText,
} from "#lib/arrange/ast/utils";

type StringNodeVisitor = (
  classLiteral: TailwindClassLiteral,
  sf: ts.SourceFile,
  cnCall?: ts.CallExpression,
) => void;

export function traverseTvObject(
  sf: ts.SourceFile,
  obj: ts.ObjectLiteralExpression,
  visitor: StringNodeVisitor,
  depth = 0,
  knownBindings?: Set<string>,
): void {
  if (depth > MAX_OBJECT_DEPTH) return;
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const init = prop.initializer;

    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
      visitor(init, sf, undefined);
    } else if (ts.isArrayLiteralExpression(init)) {
      for (const arrayElement of init.elements) {
        if (ts.isSpreadElement(arrayElement)) continue;
        if (ts.isStringLiteral(arrayElement) || ts.isNoSubstitutionTemplateLiteral(arrayElement)) {
          visitor(arrayElement, sf, undefined);
        } else if (
          ts.isCallExpression(arrayElement) &&
          isCnOrTvIdentifier(arrayElement.expression, "cn", knownBindings)
        ) {
          for (const arg of arrayElement.arguments) {
            forEachStringLiteralInClassExpression(arg, (lit) => {
              visitor(lit, sf, arrayElement);
            });
          }
        } else if (ts.isObjectLiteralExpression(arrayElement)) {
          for (const objectProperty of arrayElement.properties) {
            if (!ts.isPropertyAssignment(objectProperty)) continue;
            const propName = propertyAssignmentNameText(objectProperty);
            if (propName !== "className" && propName !== "class") continue;
            const innerInit = objectProperty.initializer;
            if (ts.isStringLiteral(innerInit) || ts.isNoSubstitutionTemplateLiteral(innerInit)) {
              visitor(innerInit, sf, undefined);
            } else if (ts.isArrayLiteralExpression(innerInit)) {
              for (const nestedArrayElement of innerInit.elements) {
                if (ts.isSpreadElement(nestedArrayElement)) continue;
                if (
                  ts.isStringLiteral(nestedArrayElement) ||
                  ts.isNoSubstitutionTemplateLiteral(nestedArrayElement)
                ) {
                  visitor(nestedArrayElement, sf, undefined);
                }
              }
            } else if (
              ts.isCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              for (const arg of innerInit.arguments) {
                forEachStringLiteralInClassExpression(arg, (lit) => {
                  visitor(lit, sf, innerInit);
                });
              }
            }
          }
        }
      }
    } else if (ts.isObjectLiteralExpression(init)) {
      traverseTvObject(sf, init, visitor, depth + 1, knownBindings);
    } else if (
      ts.isCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      for (const arg of init.arguments) {
        forEachStringLiteralInClassExpression(arg, (lit) => {
          visitor(lit, sf, init);
        });
      }
    }
  }
}

export function collectCnCallsInsideTv(
  sf: ts.SourceFile,
  obj: ts.ObjectLiteralExpression,
  knownBindings: Set<string>,
  depth = 0,
): ts.CallExpression[] {
  if (depth > MAX_OBJECT_DEPTH) return [];
  const calls: ts.CallExpression[] = [];
  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const init = prop.initializer;

    if (ts.isArrayLiteralExpression(init)) {
      for (const arrayElement of init.elements) {
        if (ts.isSpreadElement(arrayElement)) continue;
        if (
          ts.isCallExpression(arrayElement) &&
          isCnOrTvIdentifier(arrayElement.expression, "cn", knownBindings)
        ) {
          calls.push(arrayElement);
        } else if (ts.isObjectLiteralExpression(arrayElement)) {
          for (const objectProperty of arrayElement.properties) {
            if (!ts.isPropertyAssignment(objectProperty)) continue;
            const propName = propertyAssignmentNameText(objectProperty);
            if (propName !== "className" && propName !== "class") continue;
            const innerInit = objectProperty.initializer;
            if (
              ts.isCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              calls.push(innerInit);
            }
          }
        }
      }
    } else if (ts.isObjectLiteralExpression(init)) {
      calls.push(...collectCnCallsInsideTv(sf, init, knownBindings, depth + 1));
    } else if (
      ts.isCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      calls.push(init);
    }
  }
  return calls;
}

export function listAllCnCallsInsideTvInSourceFile(
  sf: ts.SourceFile,
  knownBindings: Set<string>,
): ts.CallExpression[] {
  const calls: ts.CallExpression[] = [];
  const visitTypeScriptSubtree = (tsNode: ts.Node): void => {
    if (ts.isCallExpression(tsNode) && isCnOrTvIdentifier(tsNode.expression, "tv", knownBindings)) {
      const arg0 = tsNode.arguments[0];
      if (arg0 && ts.isObjectLiteralExpression(arg0)) {
        calls.push(...collectCnCallsInsideTv(sf, arg0, knownBindings, 0));
      }
    }
    ts.forEachChild(tsNode, visitTypeScriptSubtree);
  };
  visitTypeScriptSubtree(sf);
  return calls;
}

export function makeStringNode(
  nodes: TailwindClassLiteral[],
  sf: ts.SourceFile,
  isTvContext: boolean,
  cnCall?: ts.CallExpression,
): StringNode {
  return {
    nodes,
    sf,
    isTvContext,
    cnCall,
    get primaryClassLiteral() {
      return this.nodes[0]!;
    },
  };
}

export function slotClassString(stringNode: StringNode): string {
  return stringNode.nodes.map((literal) => literal.text).join(" ");
}

export function emitTvSlot(
  lits: TailwindClassLiteral[],
  sf: ts.SourceFile,
  cnCall: ts.CallExpression | undefined,
  results: StringNode[],
  seenNodePos: Set<number>,
): void {
  if (lits.length === 0) return;
  const firstPos = lits[0]!.getStart(sf);
  if (seenNodePos.has(firstPos)) return;
  seenNodePos.add(firstPos);

  const totalTokens = lits.reduce(
    (accumulatedTokenCount, literal) =>
      accumulatedTokenCount + tokenizeClassString(literal.text).length,
    0,
  );
  if (totalTokens < APPLY_MIN_TOKENS) return;
  results.push(makeStringNode(lits, sf, true, cnCall));
}

export function collectTvSlots(
  sf: ts.SourceFile,
  obj: ts.ObjectLiteralExpression,
  knownBindings: Set<string>,
  results: StringNode[],
  seenNodePos: Set<number>,
  depth = 0,
): void {
  if (depth > MAX_OBJECT_DEPTH) return;

  for (const prop of obj.properties) {
    if (!ts.isPropertyAssignment(prop)) continue;
    const init = prop.initializer;

    if (ts.isStringLiteral(init) || ts.isNoSubstitutionTemplateLiteral(init)) {
      emitTvSlot([init], sf, undefined, results, seenNodePos);
    } else if (ts.isArrayLiteralExpression(init)) {
      const arrayPos = init.getStart(sf);
      if (seenNodePos.has(arrayPos)) continue;
      seenNodePos.add(arrayPos);

      const staticLits: TailwindClassLiteral[] = [];
      for (const arrayElement of init.elements) {
        if (ts.isSpreadElement(arrayElement)) continue;
        if (ts.isStringLiteral(arrayElement) || ts.isNoSubstitutionTemplateLiteral(arrayElement)) {
          staticLits.push(arrayElement);
        } else if (
          ts.isCallExpression(arrayElement) &&
          isCnOrTvIdentifier(arrayElement.expression, "cn", knownBindings)
        ) {
          for (const arg of arrayElement.arguments) {
            forEachStringLiteralInClassExpression(
              arg,
              (lit) => {
                if (!isUnsafeLiteralForCnStyleApplySplit(lit)) staticLits.push(lit);
              },
              0,
              CN_APPLY_LITERAL_WALK_OPTS,
            );
          }
        } else if (ts.isObjectLiteralExpression(arrayElement)) {
          for (const objectProperty of arrayElement.properties) {
            if (!ts.isPropertyAssignment(objectProperty)) continue;
            const propName = propertyAssignmentNameText(objectProperty);
            if (propName !== "className" && propName !== "class") continue;
            const innerInit = objectProperty.initializer;
            if (ts.isStringLiteral(innerInit) || ts.isNoSubstitutionTemplateLiteral(innerInit)) {
              emitTvSlot([innerInit], sf, undefined, results, seenNodePos);
            } else if (ts.isArrayLiteralExpression(innerInit)) {
              const innerLits: TailwindClassLiteral[] = [];
              for (const nestedArrayElement of innerInit.elements) {
                if (
                  !ts.isSpreadElement(nestedArrayElement) &&
                  (ts.isStringLiteral(nestedArrayElement) ||
                    ts.isNoSubstitutionTemplateLiteral(nestedArrayElement))
                ) {
                  innerLits.push(nestedArrayElement);
                }
              }
              emitTvSlot(innerLits, sf, undefined, results, seenNodePos);
            } else if (
              ts.isCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              const cnLits: TailwindClassLiteral[] = [];
              for (const arg of innerInit.arguments) {
                forEachStringLiteralInClassExpression(
                  arg,
                  (lit) => {
                    if (!isUnsafeLiteralForCnStyleApplySplit(lit)) cnLits.push(lit);
                  },
                  0,
                  CN_APPLY_LITERAL_WALK_OPTS,
                );
              }
              emitTvSlot(cnLits, sf, innerInit, results, seenNodePos);
            }
          }
        }
      }
      if (staticLits.length > 0) {
        emitTvSlot(staticLits, sf, undefined, results, seenNodePos);
      }
    } else if (ts.isObjectLiteralExpression(init)) {
      collectTvSlots(sf, init, knownBindings, results, seenNodePos, depth + 1);
    } else if (
      ts.isCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      const cnLits: TailwindClassLiteral[] = [];
      for (const arg of init.arguments) {
        forEachStringLiteralInClassExpression(
          arg,
          (lit) => {
            if (!isUnsafeLiteralForCnStyleApplySplit(lit)) cnLits.push(lit);
          },
          0,
          CN_APPLY_LITERAL_WALK_OPTS,
        );
      }
      emitTvSlot(cnLits, sf, init, results, seenNodePos);
    }
  }
}

export function collectGroupableStringNodes(sf: ts.SourceFile): StringNode[] {
  const results: StringNode[] = [];
  const seenNodePos = new Set<number>();
  const knownBindings = buildKnownCnTvBindings(sf);

  const visitTypeScriptSubtree = (tsNode: ts.Node): void => {
    if (ts.isCallExpression(tsNode)) {
      if (isCnOrTvIdentifier(tsNode.expression, "cn", knownBindings)) {
        const callPos = tsNode.getStart(sf);
        if (seenNodePos.has(callPos)) {
          ts.forEachChild(tsNode, visitTypeScriptSubtree);
          return;
        }
        seenNodePos.add(callPos);

        const staticLits = collectUnconditionalTailwindLiteralsFromCnArguments(tsNode.arguments);

        const totalTokens = staticLits.reduce(
          (accumulatedTokenCount, literal) =>
            accumulatedTokenCount + tokenizeClassString(literal.text).length,
          0,
        );
        if (staticLits.length > 0 && totalTokens >= APPLY_MIN_TOKENS) {
          results.push(makeStringNode(staticLits, sf, false, tsNode));
        }
      } else if (isCnOrTvIdentifier(tsNode.expression, "tv", knownBindings)) {
        const arg0 = tsNode.arguments[0];
        if (arg0 && ts.isObjectLiteralExpression(arg0)) {
          collectTvSlots(sf, arg0, knownBindings, results, seenNodePos);
        }
      }
    }
    ts.forEachChild(tsNode, visitTypeScriptSubtree);
  };

  visitTypeScriptSubtree(sf);
  return results;
}
