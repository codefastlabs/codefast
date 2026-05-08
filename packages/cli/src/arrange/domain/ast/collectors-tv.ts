import { APPLY_MIN_TOKENS, MAX_OBJECT_DEPTH } from "#/arrange/domain/constants";
import {
  isDomainArrayLiteralExpression,
  isDomainCallExpression,
  isDomainObjectLiteralExpression,
  isDomainPropertyAssignment,
  isDomainSpreadElement,
  isDomainTailwindClassLiteral,
  forEachDomainChild,
} from "#/arrange/domain/ast/ast-node";
import type {
  DomainAstNode,
  DomainCallExpression,
  DomainObjectLiteralExpression,
  DomainSourceFile,
} from "#/arrange/domain/ast/ast-node";
import {
  CN_APPLY_LITERAL_WALK_OPTS,
  collectUnconditionalTailwindLiteralsFromCnArguments,
  forEachStringLiteralInClassExpression,
  isUnsafeLiteralForCnStyleApplySplit,
} from "#/arrange/domain/ast/collectors-cn";
import type { StringNode, TailwindClassLiteral } from "#/arrange/domain/types";
import { tokenizeClassString } from "#/arrange/domain/tailwind-token";
import {
  buildKnownCnTvBindings,
  isCnOrTvIdentifier,
  propertyAssignmentNameText,
} from "#/arrange/domain/ast/helpers";

type StringNodeVisitor = (
  classLiteral: TailwindClassLiteral,
  sourceFile: DomainSourceFile,
  cnCall?: DomainCallExpression,
) => void;

/**
 * @since 0.3.16-canary.0
 */
export function traverseTvObject(
  sourceFile: DomainSourceFile,
  obj: DomainObjectLiteralExpression,
  visitor: StringNodeVisitor,
  depth = 0,
  knownBindings?: Set<string>,
): void {
  if (depth > MAX_OBJECT_DEPTH) {
    return;
  }
  for (const prop of obj.properties) {
    if (!isDomainPropertyAssignment(prop)) {
      continue;
    }
    const init = prop.initializer;

    if (isDomainTailwindClassLiteral(init)) {
      visitor(init, sourceFile, undefined);
    } else if (isDomainArrayLiteralExpression(init)) {
      for (const arrayElement of init.elements) {
        if (isDomainSpreadElement(arrayElement)) {
          continue;
        }
        if (isDomainTailwindClassLiteral(arrayElement)) {
          visitor(arrayElement, sourceFile, undefined);
        } else if (
          isDomainCallExpression(arrayElement) &&
          isCnOrTvIdentifier(arrayElement.expression, "cn", knownBindings)
        ) {
          for (const arg of arrayElement.arguments) {
            forEachStringLiteralInClassExpression(arg, (lit) => {
              visitor(lit, sourceFile, arrayElement);
            });
          }
        } else if (isDomainObjectLiteralExpression(arrayElement)) {
          for (const objectProperty of arrayElement.properties) {
            if (!isDomainPropertyAssignment(objectProperty)) {
              continue;
            }
            const propName = propertyAssignmentNameText(objectProperty);
            if (propName !== "className" && propName !== "class") {
              continue;
            }
            const innerInit = objectProperty.initializer;
            if (isDomainTailwindClassLiteral(innerInit)) {
              visitor(innerInit, sourceFile, undefined);
            } else if (isDomainArrayLiteralExpression(innerInit)) {
              for (const nestedArrayElement of innerInit.elements) {
                if (isDomainSpreadElement(nestedArrayElement)) {
                  continue;
                }
                if (isDomainTailwindClassLiteral(nestedArrayElement)) {
                  visitor(nestedArrayElement, sourceFile, undefined);
                }
              }
            } else if (
              isDomainCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              for (const arg of innerInit.arguments) {
                forEachStringLiteralInClassExpression(arg, (lit) => {
                  visitor(lit, sourceFile, innerInit);
                });
              }
            }
          }
        }
      }
    } else if (isDomainObjectLiteralExpression(init)) {
      traverseTvObject(sourceFile, init, visitor, depth + 1, knownBindings);
    } else if (
      isDomainCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      for (const arg of init.arguments) {
        forEachStringLiteralInClassExpression(arg, (lit) => {
          visitor(lit, sourceFile, init);
        });
      }
    }
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function collectCnCallsInsideTv(
  sourceFile: DomainSourceFile,
  obj: DomainObjectLiteralExpression,
  knownBindings: Set<string>,
  depth = 0,
): Array<DomainCallExpression> {
  if (depth > MAX_OBJECT_DEPTH) {
    return [];
  }
  const calls: Array<DomainCallExpression> = [];
  for (const prop of obj.properties) {
    if (!isDomainPropertyAssignment(prop)) {
      continue;
    }
    const init = prop.initializer;

    if (isDomainArrayLiteralExpression(init)) {
      for (const arrayElement of init.elements) {
        if (isDomainSpreadElement(arrayElement)) {
          continue;
        }
        if (
          isDomainCallExpression(arrayElement) &&
          isCnOrTvIdentifier(arrayElement.expression, "cn", knownBindings)
        ) {
          calls.push(arrayElement);
        } else if (isDomainObjectLiteralExpression(arrayElement)) {
          for (const objectProperty of arrayElement.properties) {
            if (!isDomainPropertyAssignment(objectProperty)) {
              continue;
            }
            const propName = propertyAssignmentNameText(objectProperty);
            if (propName !== "className" && propName !== "class") {
              continue;
            }
            const innerInit = objectProperty.initializer;
            if (
              isDomainCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              calls.push(innerInit);
            }
          }
        }
      }
    } else if (isDomainObjectLiteralExpression(init)) {
      calls.push(...collectCnCallsInsideTv(sourceFile, init, knownBindings, depth + 1));
    } else if (
      isDomainCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      calls.push(init);
    }
  }
  return calls;
}

/**
 * @since 0.3.16-canary.0
 */
export function listAllCnCallsInsideTvInSourceFile(
  sourceFile: DomainSourceFile,
  knownBindings: Set<string>,
): Array<DomainCallExpression> {
  const calls: Array<DomainCallExpression> = [];
  const visitSubtree = (tsNode: DomainAstNode): void => {
    if (
      isDomainCallExpression(tsNode) &&
      isCnOrTvIdentifier(tsNode.expression, "tv", knownBindings)
    ) {
      const arg0 = tsNode.arguments[0];
      if (arg0 && isDomainObjectLiteralExpression(arg0)) {
        calls.push(...collectCnCallsInsideTv(sourceFile, arg0, knownBindings, 0));
      }
    }
    forEachDomainChild(tsNode, visitSubtree);
  };
  for (const stmt of sourceFile.statements) {
    visitSubtree(stmt);
  }
  return calls;
}

function makeStringNode(
  nodes: Array<TailwindClassLiteral>,
  sourceFile: DomainSourceFile,
  isTvContext: boolean,
  cnCall?: DomainCallExpression,
): StringNode {
  return {
    nodes,
    sf: sourceFile,
    isTvContext,
    cnCall,
    get primaryClassLiteral() {
      const first = this.nodes[0];
      if (first === undefined) {
        throw new Error("invariant: StringNode requires at least one class literal");
      }
      return first;
    },
  };
}

/**
 * @since 0.3.16-canary.0
 */
export function slotClassString(stringNode: StringNode): string {
  return stringNode.nodes.map((literal) => literal.text).join(" ");
}

function emitTvSlot(
  lits: Array<TailwindClassLiteral>,
  sourceFile: DomainSourceFile,
  cnCall: DomainCallExpression | undefined,
  results: Array<StringNode>,
  seenNodePos: Set<number>,
): void {
  if (lits.length === 0) {
    return;
  }
  const firstLit = lits[0];
  if (firstLit === undefined) {
    return;
  }
  const firstPos = firstLit.pos;
  if (seenNodePos.has(firstPos)) {
    return;
  }
  seenNodePos.add(firstPos);

  const totalTokens = lits.reduce(
    (accumulatedTokenCount, literal) =>
      accumulatedTokenCount + tokenizeClassString(literal.text).length,
    0,
  );
  if (totalTokens < APPLY_MIN_TOKENS) {
    return;
  }
  results.push(makeStringNode(lits, sourceFile, true, cnCall));
}

function collectTvSlots(
  sourceFile: DomainSourceFile,
  obj: DomainObjectLiteralExpression,
  knownBindings: Set<string>,
  results: Array<StringNode>,
  seenNodePos: Set<number>,
  depth = 0,
): void {
  if (depth > MAX_OBJECT_DEPTH) {
    return;
  }

  for (const prop of obj.properties) {
    if (!isDomainPropertyAssignment(prop)) {
      continue;
    }
    const init = prop.initializer;

    if (isDomainTailwindClassLiteral(init)) {
      emitTvSlot([init], sourceFile, undefined, results, seenNodePos);
    } else if (isDomainArrayLiteralExpression(init)) {
      const arrayPos = init.pos;
      if (seenNodePos.has(arrayPos)) {
        continue;
      }
      seenNodePos.add(arrayPos);

      const staticLits: Array<TailwindClassLiteral> = [];
      for (const arrayElement of init.elements) {
        if (isDomainSpreadElement(arrayElement)) {
          continue;
        }
        if (isDomainTailwindClassLiteral(arrayElement)) {
          staticLits.push(arrayElement);
        } else if (
          isDomainCallExpression(arrayElement) &&
          isCnOrTvIdentifier(arrayElement.expression, "cn", knownBindings)
        ) {
          for (const arg of arrayElement.arguments) {
            forEachStringLiteralInClassExpression(
              arg,
              (lit) => {
                if (!isUnsafeLiteralForCnStyleApplySplit(lit)) {
                  staticLits.push(lit);
                }
              },
              0,
              CN_APPLY_LITERAL_WALK_OPTS,
            );
          }
        } else if (isDomainObjectLiteralExpression(arrayElement)) {
          for (const objectProperty of arrayElement.properties) {
            if (!isDomainPropertyAssignment(objectProperty)) {
              continue;
            }
            const propName = propertyAssignmentNameText(objectProperty);
            if (propName !== "className" && propName !== "class") {
              continue;
            }
            const innerInit = objectProperty.initializer;
            if (isDomainTailwindClassLiteral(innerInit)) {
              emitTvSlot([innerInit], sourceFile, undefined, results, seenNodePos);
            } else if (isDomainArrayLiteralExpression(innerInit)) {
              const innerLits: Array<TailwindClassLiteral> = [];
              for (const nestedArrayElement of innerInit.elements) {
                if (
                  !isDomainSpreadElement(nestedArrayElement) &&
                  isDomainTailwindClassLiteral(nestedArrayElement)
                ) {
                  innerLits.push(nestedArrayElement);
                }
              }
              emitTvSlot(innerLits, sourceFile, undefined, results, seenNodePos);
            } else if (
              isDomainCallExpression(innerInit) &&
              isCnOrTvIdentifier(innerInit.expression, "cn", knownBindings)
            ) {
              const cnLits: Array<TailwindClassLiteral> = [];
              for (const arg of innerInit.arguments) {
                forEachStringLiteralInClassExpression(
                  arg,
                  (lit) => {
                    if (!isUnsafeLiteralForCnStyleApplySplit(lit)) {
                      cnLits.push(lit);
                    }
                  },
                  0,
                  CN_APPLY_LITERAL_WALK_OPTS,
                );
              }
              emitTvSlot(cnLits, sourceFile, innerInit, results, seenNodePos);
            }
          }
        }
      }
      if (staticLits.length > 0) {
        emitTvSlot(staticLits, sourceFile, undefined, results, seenNodePos);
      }
    } else if (isDomainObjectLiteralExpression(init)) {
      collectTvSlots(sourceFile, init, knownBindings, results, seenNodePos, depth + 1);
    } else if (
      isDomainCallExpression(init) &&
      isCnOrTvIdentifier(init.expression, "cn", knownBindings)
    ) {
      const cnLits: Array<TailwindClassLiteral> = [];
      for (const arg of init.arguments) {
        forEachStringLiteralInClassExpression(
          arg,
          (lit) => {
            if (!isUnsafeLiteralForCnStyleApplySplit(lit)) {
              cnLits.push(lit);
            }
          },
          0,
          CN_APPLY_LITERAL_WALK_OPTS,
        );
      }
      emitTvSlot(cnLits, sourceFile, init, results, seenNodePos);
    }
  }
}

/**
 * @since 0.3.16-canary.0
 */
export function collectGroupableStringNodes(sourceFile: DomainSourceFile): Array<StringNode> {
  const results: Array<StringNode> = [];
  const seenNodePos = new Set<number>();
  const knownBindings = buildKnownCnTvBindings(sourceFile);

  const visitTypeScriptSubtree = (tsNode: DomainAstNode): void => {
    if (isDomainCallExpression(tsNode)) {
      if (isCnOrTvIdentifier(tsNode.expression, "cn", knownBindings)) {
        const callPos = tsNode.pos;
        if (seenNodePos.has(callPos)) {
          forEachDomainChild(tsNode, visitTypeScriptSubtree);
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
          results.push(makeStringNode(staticLits, sourceFile, false, tsNode));
        }
      } else if (isCnOrTvIdentifier(tsNode.expression, "tv", knownBindings)) {
        const arg0 = tsNode.arguments[0];
        if (arg0 && isDomainObjectLiteralExpression(arg0)) {
          collectTvSlots(sourceFile, arg0, knownBindings, results, seenNodePos);
        }
      }
    }
    forEachDomainChild(tsNode, visitTypeScriptSubtree);
  };

  for (const stmt of sourceFile.statements) {
    visitTypeScriptSubtree(stmt);
  }
  return results;
}
