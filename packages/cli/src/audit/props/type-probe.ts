/** Type probe that resolves what each part of a props intersection is. */

import type { Node, SourceFile, TypeNode } from "typescript/unstable/ast";
import type { Checker, Type } from "typescript/unstable/sync";

import type { ConstituentKind, IntersectionPart } from "#audit/props/domain/props-intersection";
import { loadTypeServer, loadTypeServerSyntax } from "#core/type-server";

/** Resolves the kind of each intersection part in one file, in the order given. */
type ConstituentClassifier = (parts: ReadonlyArray<IntersectionPart>) => Array<ConstituentKind>;

/**
 * A whole-run type probe backing `audit props`, bound to one type server.
 */
export interface PropsTypeProbe {
  /** Returns the file's classifier, which reports every part unresolved when no project types the file. */
  forFile(filePath: string): ConstituentClassifier;
  dispose(): void;
}

// ── Type inspection ──────────────────────────────────────────────────────────────────────────────────────────────────

/** True when a type argument leaves a mapped type's keys unknown until instantiation. */
function isGenericArgument(type: Type, mappedFlag: number): boolean {
  if (type.isTypeParameter() || type.isIndexType()) {
    return true;
  }
  if (type.isUnionType() || type.isIntersectionType()) {
    return (type.getTypes() ?? []).some((part) => isGenericArgument(part, mappedFlag));
  }
  return isGenericMappedType(type, mappedFlag);
}

/** True for a mapped type over a type parameter (`Partial<T>`, `Omit<T, K>`), whose members are not statically known. */
function isGenericMappedType(type: Type, mappedFlag: number): boolean {
  return (
    type.isObjectType() &&
    (type.objectFlags & mappedFlag) !== 0 &&
    type.getAliasTypeArguments().some((argument) => isGenericArgument(argument, mappedFlag))
  );
}

/** Classifies a resolved part by whether an interface may extend it — TypeScript's own valid-base-type rule. */
function kindOfType(type: Type, mappedFlag: number): ConstituentKind {
  if (type.isErrorType()) {
    return "unresolved";
  }
  if (type.isUnionType()) {
    return "union";
  }
  if (type.isTypeParameter() || isGenericMappedType(type, mappedFlag)) {
    return "type-parameter";
  }
  if (type.isIntersectionType()) {
    const kinds = (type.getTypes() ?? []).map((part) => kindOfType(part, mappedFlag));
    return kinds.includes("unresolved") ? "unresolved" : (kinds.find((kind) => kind !== "object") ?? "object");
  }
  return type.isObjectType() ? "object" : "other";
}

// ── Probe lifecycle ──────────────────────────────────────────────────────────────────────────────────────────────────

/**
 * Creates a type probe over the native TypeScript type server for `audit props`.
 *
 * @throws AppError when the `typescript` package providing the type server cannot be loaded.
 */
export async function createPropsTypeProbe(): Promise<PropsTypeProbe> {
  const sync = await loadTypeServer("audit props");
  const syntax = await loadTypeServerSyntax("audit props");
  const api = new sync.API();
  const mappedFlag = sync.ObjectFlags.Mapped;

  /** Indexes every intersection part in a file by its span, the key oxc reports it under. */
  function indexParts(sourceFile: SourceFile): Map<string, TypeNode> {
    const parts = new Map<string, TypeNode>();
    const visit = (node: Node): void => {
      if (syntax.isIntersectionTypeNode(node)) {
        for (const part of node.types) {
          parts.set(`${syntax.getTokenPosOfNode(part, sourceFile)}:${part.end}`, part);
        }
      }
      node.forEachChild(visit);
    };
    sourceFile.forEachChild(visit);
    return parts;
  }

  function classifierFor(checker: Checker, sourceFile: SourceFile): ConstituentClassifier {
    const partsBySpan = indexParts(sourceFile);
    return (parts) =>
      parts.map(({ start, end }) => {
        const node = partsBySpan.get(`${start}:${end}`);
        const type = node === undefined ? undefined : checker.getTypeFromTypeNode(node);
        return type === undefined ? "unresolved" : kindOfType(type, mappedFlag);
      });
  }

  return {
    forFile(filePath) {
      const project = api.updateSnapshot({ openFiles: [filePath] }).getDefaultProjectForFile(filePath);
      const sourceFile = project?.program.getSourceFile(filePath);
      if (project === undefined || sourceFile === undefined) {
        return (parts) => parts.map(() => "unresolved");
      }
      return classifierFor(project.checker, sourceFile);
    },
    dispose() {
      api.close();
    },
  };
}
