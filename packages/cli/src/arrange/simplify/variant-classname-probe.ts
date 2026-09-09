/** Type probe that asks whether a variant function's options accept a folded `className`. */

import type { Checker, SignatureKind, Type } from "typescript/unstable/sync";

import { AppError, messageFrom } from "#/core/errors";

/**
 * What a variant function's `className`/`class` option accepts, resolved from its type.
 */
export interface VariantClassNameAcceptance {
  readonly acceptsString: boolean;
  readonly acceptsArray: boolean;
}

/**
 * A per-file view that resolves a callee's `className` acceptance from a source offset.
 */
export interface FileClassNameProbe {
  classNameAcceptance(calleeOffset: number): VariantClassNameAcceptance | null;
}

/**
 * A whole-run type probe backing the opt-in `className` fold, bound to one type server.
 */
export interface VariantClassNameProbe {
  forFile(filePath: string): FileClassNameProbe | null;
  dispose(): void;
}

// ── Type inspection ──────────────────────────────────────────────────────────────────────────────────────────────────

/** The type of the callee's first-parameter `className` (preferred) or `class` option, if any. */
function classNameOptionType(checker: Checker, optionsType: Type): Type | undefined {
  for (const name of ["className", "class"]) {
    const symbol = checker.getPropertyOfType(optionsType, name);
    if (symbol) {
      const propertyType = checker.getTypeOfSymbol(symbol);
      if (propertyType) {
        return propertyType;
      }
    }
  }
  return undefined;
}

/** True when any constituent of the option type is array-like — the option accepts a class array. */
function optionAcceptsArray(checker: Checker, optionType: Type): boolean {
  const constituents = optionType.isUnionType() ? optionType.getTypes() : [optionType];
  return constituents.some(
    (constituent) =>
      checker.isArrayType(constituent) || checker.isTupleType(constituent) || checker.isArrayLikeType(constituent),
  );
}

/** Resolves how the function called at `offset` accepts a `className`, or `null` when it is not a variant function. */
function classNameAcceptanceAt(
  checker: Checker,
  callKind: SignatureKind,
  filePath: string,
  offset: number,
): VariantClassNameAcceptance | null {
  const calleeType = checker.getTypeAtPosition(filePath, offset);
  if (!calleeType) {
    return null;
  }
  const signature = checker.getSignaturesOfType(calleeType, callKind)[0];
  if (!signature) {
    return null;
  }
  const parameterType = checker.getParameterType(signature, 0);
  if (!parameterType) {
    return null;
  }
  const nonNullableType = checker.getNonNullableType(parameterType);
  if (!nonNullableType) {
    return null;
  }
  const optionsType = checker.getApparentType(nonNullableType);
  if (!optionsType) {
    return null;
  }
  const optionType = classNameOptionType(checker, optionsType);
  if (!optionType) {
    return null;
  }
  return {
    acceptsString: checker.isTypeAssignableTo(checker.getStringType(), optionType),
    acceptsArray: optionAcceptsArray(checker, optionType),
  };
}

// ── Probe lifecycle ──────────────────────────────────────────────────────────────────────────────────────────────────

/** Loads the native TypeScript type-server API, or fails with a coded error naming the missing package. */
async function loadTypeServer() {
  try {
    return await import("typescript/unstable/sync");
  } catch (cause) {
    throw new AppError(
      "INFRA_FAILURE",
      `--fold-variant-classname needs the "typescript" package (v7) resolvable from the target: ${messageFrom(cause)}`,
      cause,
    );
  }
}

/**
 * Creates a type probe over the native TypeScript type server for the opt-in `className` fold.
 *
 * @throws AppError when the `typescript` package providing the type server cannot be loaded.
 */
export async function createVariantClassNameProbe(): Promise<VariantClassNameProbe> {
  const sync = await loadTypeServer();
  const api = new sync.API();
  const callKind = sync.SignatureKind.Call;

  return {
    forFile(filePath) {
      try {
        const project = api.updateSnapshot({ openFiles: [filePath] }).getDefaultProjectForFile(filePath);
        if (!project) {
          return null;
        }
        const { checker } = project;
        return {
          classNameAcceptance: (offset) => classNameAcceptanceAt(checker, callKind, filePath, offset),
        };
      } catch {
        // A file outside any tsconfig has no project to type against — skip its fold, keep the base pass.
        return null;
      }
    },
    dispose() {
      api.close();
    },
  };
}
