/** Collects cn() calls whose override classes can fold into a variant function's `className` option. */

import {
  forEachDomainChild,
  isDomainCallExpression,
  isDomainIdentifier,
  isDomainObjectLiteralExpression,
  isDomainPropertyAccessExpression,
  isDomainPropertyAssignment,
  isDomainTailwindClassLiteral,
} from "#/arrange/domain/ast/ast-node";
import type { DomainAstNode, DomainCallExpression, DomainSourceFile } from "#/arrange/domain/ast/ast-node";
import { buildKnownCnTvBindings, isCnOrTvIdentifier, propertyAssignmentNameText } from "#/arrange/domain/ast/helpers";
import type { PlannedSimplifyEdit } from "#/arrange/domain/ast/simplify-targets";
import { escapeTsStringLiteralContent } from "#/arrange/domain/source-text-formatters";
import type { FileClassNameProbe } from "#/arrange/simplify/variant-classname-probe";

type ClassPiece =
  | { readonly kind: "static"; readonly texts: Array<string> }
  | { readonly kind: "dynamic"; readonly src: string };

/** Groups a run of trailing cn() arguments, coalescing adjacent static literals into one piece. */
function coalesceTrailingArgs(args: ReadonlyArray<DomainAstNode>, sourceText: string): Array<ClassPiece> {
  const pieces: Array<ClassPiece> = [];
  for (const arg of args) {
    if (isDomainTailwindClassLiteral(arg)) {
      const last = pieces.at(-1);
      if (last?.kind === "static") {
        last.texts.push(arg.text);
      } else {
        pieces.push({ kind: "static", texts: [arg.text] });
      }
    } else {
      pieces.push({ kind: "dynamic", src: sourceText.slice(arg.pos, arg.end) });
    }
  }
  return pieces;
}

/** Renders one class piece as either a quoted merged string or the raw source of a dynamic argument. */
function renderPiece(piece: ClassPiece): string {
  return piece.kind === "static" ? `"${escapeTsStringLiteralContent(piece.texts.join(" ").trim())}"` : piece.src;
}

/** The source offset of the callee's name — an identifier or the property of a member access. */
function calleeNameOffset(expression: DomainAstNode): number | null {
  if (isDomainIdentifier(expression)) {
    return expression.pos;
  }
  if (isDomainPropertyAccessExpression(expression)) {
    return expression.name.pos;
  }
  return null;
}

/** True when the object literal is a plain bag of assignments that does not already set `className`/`class`. */
function objectAcceptsClassNameFold(objectArg: DomainCallExpression["arguments"][number]): boolean {
  if (!isDomainObjectLiteralExpression(objectArg)) {
    return false;
  }
  for (const property of objectArg.properties) {
    // A spread or shorthand parses as a non-assignment node — its `className` cannot be reasoned about.
    if (!isDomainPropertyAssignment(property)) {
      return false;
    }
    const name = propertyAssignmentNameText(property);
    if (name === "className" || name === "class") {
      return false;
    }
  }
  return true;
}

/** Plans folding one `cn(variant({…}), …overrides)` into `variant({…, className: …})`, or `null` when unsafe. */
function planClassNameFold(
  cnCall: DomainCallExpression,
  sourceText: string,
  fileProbe: FileClassNameProbe,
): PlannedSimplifyEdit | null {
  const args = cnCall.arguments;
  const variantCall = args[0];
  if (args.length < 2 || variantCall === undefined || !isDomainCallExpression(variantCall)) {
    return null;
  }
  const objectArg = variantCall.arguments[0];
  if (variantCall.arguments.length !== 1 || objectArg === undefined || !objectAcceptsClassNameFold(objectArg)) {
    return null;
  }
  const offset = calleeNameOffset(variantCall.expression);
  if (offset === null) {
    return null;
  }

  const pieces = coalesceTrailingArgs(args.slice(1), sourceText);
  if (pieces.length === 0) {
    return null;
  }

  // A dynamic override or more than one piece becomes an array, so the option must accept one; a
  // single static override stays a scalar string. Types decide whether either shape is legal.
  const needsArray = pieces.length > 1 || pieces.some((piece) => piece.kind === "dynamic");
  const acceptance = fileProbe.classNameAcceptance(offset);
  if (!acceptance || (needsArray ? !acceptance.acceptsArray : !acceptance.acceptsString)) {
    return null;
  }

  const rendered = pieces.map(renderPiece);
  const classNameValue = pieces.length > 1 ? `[${rendered.join(", ")}]` : rendered[0];
  const optionsInner = sourceText
    .slice(objectArg.pos + 1, objectArg.end - 1)
    .trim()
    .replace(/,$/, "")
    .trim();
  const calleeSrc = sourceText.slice(variantCall.expression.pos, variantCall.expression.end);
  const newInner =
    optionsInner.length > 0 ? `${optionsInner}, className: ${classNameValue}` : `className: ${classNameValue}`;

  return {
    start: cnCall.pos,
    end: cnCall.end,
    replacement: `${calleeSrc}({ ${newInner} })`,
    label: "cn-fold-classname",
  };
}

/**
 * Collects `className` fold edits for every foldable `cn(variant({…}), …)` call in a source file.
 */
export function collectClassNameFoldTargets(
  sourceFile: DomainSourceFile,
  fileProbe: FileClassNameProbe,
): Array<PlannedSimplifyEdit> {
  const sourceText = sourceFile.text;
  const knownBindings = buildKnownCnTvBindings(sourceFile);
  const results: Array<PlannedSimplifyEdit> = [];

  const visit = (node: DomainAstNode): void => {
    if (isDomainCallExpression(node) && isCnOrTvIdentifier(node.expression, "cn", knownBindings)) {
      const edit = planClassNameFold(node, sourceText, fileProbe);
      if (edit) {
        results.push(edit);
      }
    }
    forEachDomainChild(node, visit);
  };

  for (const statement of sourceFile.statements) {
    visit(statement);
  }

  return results;
}
