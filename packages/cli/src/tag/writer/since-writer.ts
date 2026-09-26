import { parseSync } from "oxc-parser";

import { isDirectiveLine, isNoteLine } from "#audit/comments/domain/comment-content";
import type { Filesystem } from "#core/filesystem/filesystem";
import type { OxcNode } from "#core/oxc-node";
import { isOxcNode, programStatements } from "#core/oxc-node";
import { lineOfOffset } from "#core/source-position";
import { applyEditsDescending, indentOfLineContaining } from "#core/source-text-edit";
import type { TagBlockedDeclaration, TagFileResult } from "#tag/domain/types";

type TextEdit = {
  start: number;
  end: number;
  replacement: string;
};

interface OxcComment {
  readonly type: "Block" | "Line";
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Top-level statement kinds that carry a `@since` tag. `TSDeclareFunction` is a function with no body —
 * an overload signature or a `declare function` — which the `.d.ts` keeps with its own doc block.
 */
const TAGGABLE_DECLARATION_TYPES = new Set([
  "FunctionDeclaration",
  "TSDeclareFunction",
  "ClassDeclaration",
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "TSEnumDeclaration",
  "VariableDeclaration",
]);

function identifierName(node: unknown): string | undefined {
  if (isOxcNode(node) && node.type === "Identifier" && typeof node.name === "string") {
    return node.name;
  }
  return undefined;
}

function lineAboveOffset(sourceText: string, offset: number): string | undefined {
  const lineStart = sourceText.lastIndexOf("\n", offset - 1) + 1;
  if (lineStart === 0) {
    return undefined;
  }
  const lineAboveStart = lineStart >= 2 ? sourceText.lastIndexOf("\n", lineStart - 2) + 1 : 0;
  return sourceText.slice(lineAboveStart, lineStart - 1);
}

/**
 * The writer that adds missing `@since` tags to a file's exported declarations.
 *
 * @since 0.3.16-canary.0
 */
export class TagSinceWriter {
  private readonly sinceDocumentationTag = "@since";

  constructor(private readonly fs: Filesystem) {}

  applySinceTagsToFile(filePath: string, version: string, write: boolean): TagFileResult {
    const sourceText = this.fs.readFileSync(filePath, "utf8");
    const { program, comments } = parseSync(filePath, sourceText);
    const statements = programStatements(program);
    const jsDocComments = (comments as ReadonlyArray<OxcComment>).filter(
      (comment) => comment.type === "Block" && comment.value.startsWith("*"),
    );

    const edits: Array<TextEdit> = [];
    const blockedDeclarations: Array<TagBlockedDeclaration> = [];
    for (const declaration of this.collectExportedDeclarations(statements)) {
      const existing = this.associatedJsDoc(declaration, jsDocComments, sourceText);
      if (existing === undefined && this.isDocBlockLineTaken(declaration, sourceText)) {
        const names = this.taggableDeclarationOf(declaration)?.names ?? [];
        blockedDeclarations.push({
          filePath,
          line: lineOfOffset(sourceText, declaration.start),
          name: names.length > 0 ? names.join(", ") : "default",
        });
        continue;
      }
      const edit = this.makeDeclarationSinceLine(declaration, existing, sourceText, version);
      if (edit) {
        edits.push(edit);
      }
    }

    // A blocked declaration holds its whole file back, so every reported line matches the file on disk.
    const appliedEdits = blockedDeclarations.length > 0 ? [] : edits;
    if (appliedEdits.length > 0 && write) {
      const updated = applyEditsDescending(sourceText, appliedEdits);
      this.fs.writeFileSync(filePath, updated, "utf8");
    }

    return {
      filePath,
      taggedDeclarations: appliedEdits.length,
      blockedDeclarations,
      changed: appliedEdits.length > 0,
    };
  }

  /**
   * The taggable declaration a top-level statement introduces, resolving the
   * `export … <decl>` wrapper to the wrapper node — its `start` sits at `export`,
   * matching `ts.getStart` on a modifier-bearing declaration.
   */
  private taggableDeclarationOf(statement: OxcNode): { anchor: OxcNode; names: Array<string> } | undefined {
    if (TAGGABLE_DECLARATION_TYPES.has(statement.type)) {
      return { anchor: statement, names: this.declarationNames(statement) };
    }
    if (statement.type === "ExportNamedDeclaration" || statement.type === "ExportDefaultDeclaration") {
      const declaration = statement.declaration;
      if (isOxcNode(declaration) && TAGGABLE_DECLARATION_TYPES.has(declaration.type)) {
        return { anchor: statement, names: this.declarationNames(declaration) };
      }
    }
    return undefined;
  }

  private declarationNames(declaration: OxcNode): Array<string> {
    if (declaration.type === "VariableDeclaration") {
      const declarators = Array.isArray(declaration.declarations)
        ? (declaration.declarations as ReadonlyArray<OxcNode>)
        : [];
      const names: Array<string> = [];
      for (const declarator of declarators) {
        const name = identifierName(declarator.id);
        if (name !== undefined) {
          names.push(name);
        }
      }
      return names;
    }
    const name = identifierName(declaration.id);
    return name === undefined ? [] : [name];
  }

  private addDeclarationName(registry: Map<string, Set<OxcNode>>, name: string, anchor: OxcNode): void {
    const bucket = registry.get(name);
    if (bucket === undefined) {
      registry.set(name, new Set([anchor]));
      return;
    }
    bucket.add(anchor);
  }

  private collectLocalNamedDeclarations(statements: ReadonlyArray<OxcNode>): Map<string, Set<OxcNode>> {
    const declarations = new Map<string, Set<OxcNode>>();
    for (const statement of statements) {
      const taggable = this.taggableDeclarationOf(statement);
      if (!taggable) {
        continue;
      }
      for (const name of taggable.names) {
        this.addDeclarationName(declarations, name, taggable.anchor);
      }
    }
    return declarations;
  }

  private collectExportedDeclarations(statements: ReadonlyArray<OxcNode>): Set<OxcNode> {
    const exported = new Set<OxcNode>();
    const localNamed = this.collectLocalNamedDeclarations(statements);

    const addByLocalName = (name: string | undefined): void => {
      if (name === undefined) {
        return;
      }
      const anchors = localNamed.get(name);
      if (!anchors) {
        return;
      }
      for (const anchor of anchors) {
        exported.add(anchor);
      }
    };

    for (const statement of statements) {
      if (statement.type === "ExportNamedDeclaration") {
        // `export function foo() {}` — the wrapper is itself the taggable anchor.
        if (isOxcNode(statement.declaration)) {
          const taggable = this.taggableDeclarationOf(statement);
          if (taggable) {
            exported.add(taggable.anchor);
          }
          continue;
        }
        // `export { local }` (no re-export source) — resolve each local binding.
        if (statement.source === null && Array.isArray(statement.specifiers)) {
          for (const specifier of statement.specifiers as ReadonlyArray<OxcNode>) {
            addByLocalName(identifierName(specifier.local));
          }
        }
        continue;
      }

      if (TAGGABLE_DECLARATION_TYPES.has(statement.type)) {
        continue;
      }

      // `export default function foo() {}` — declaration is the taggable anchor.
      if (statement.type === "ExportDefaultDeclaration") {
        const taggable = this.taggableDeclarationOf(statement);
        if (taggable) {
          exported.add(taggable.anchor);
          continue;
        }
        // `export default localName` — resolve the referenced declaration.
        addByLocalName(identifierName(statement.declaration));
        continue;
      }

      // `export = localName`.
      if (statement.type === "TSExportAssignment") {
        addByLocalName(identifierName(statement.expression));
      }
    }

    return exported;
  }

  /**
   * The JSDoc block documenting `anchor`: the nearest preceding `/** … *\/` whose
   * gap to the declaration is whitespace only, mirroring TS comment attachment.
   */
  private associatedJsDoc(
    anchor: OxcNode,
    jsDocComments: ReadonlyArray<OxcComment>,
    sourceText: string,
  ): OxcComment | undefined {
    let associated: OxcComment | undefined;
    for (const comment of jsDocComments) {
      if (comment.end > anchor.start) {
        break;
      }
      if (/^\s*$/.test(sourceText.slice(comment.end, anchor.start))) {
        associated = comment;
      }
    }
    return associated;
  }

  private jsDocHasSinceTag(comment: OxcComment): boolean {
    return comment.value
      .split("\n")
      .map((line) => line.replace(/^\s*\*?\s?/, ""))
      .some((line) => /^@since\b/.test(line));
  }

  private makeJSDocSinceLine(commentStart: number, commentEnd: number, sourceText: string, version: string): TextEdit {
    const commentText = sourceText.slice(commentStart, commentEnd);
    const baseIndent = indentOfLineContaining(sourceText, commentStart);
    const rawBody = commentText.replace(/^\/\*\*\s?/, "").replace(/\s*\*\/$/, "");
    const normalizedBodyLines = rawBody
      .split("\n")
      .map((line) => line.replace(/^\s*\*\s?/, "").replace(/\s+$/, ""))
      .filter((line, lineIndex, lines) => {
        if (line.length > 0) {
          return true;
        }
        const hasNonEmptyBefore = lines.slice(0, lineIndex).some((value) => value.length > 0);
        const hasNonEmptyAfter = lines.slice(lineIndex + 1).some((value) => value.length > 0);
        return hasNonEmptyBefore && hasNonEmptyAfter;
      });

    const formattedBody =
      normalizedBodyLines.length > 0
        ? `${normalizedBodyLines
            .map((line) => (line.length > 0 ? `${baseIndent} * ${line}` : `${baseIndent} *`))
            .join("\n")}\n${baseIndent} *\n`
        : "";
    const tag = this.sinceDocumentationTag;
    const replacement = `/**\n${formattedBody}${baseIndent} * ${tag} ${version}\n${baseIndent} */`;
    return { start: commentStart, end: commentEnd, replacement };
  }

  private makeSinceOnlyJSDocBlock(declarationIndent: string, version: string): string {
    const tag = this.sinceDocumentationTag;
    return `/**\n${declarationIndent} * ${tag} ${version}\n${declarationIndent} */`;
  }

  /**
   * Returns whether the line above `anchor` holds a `//` note, which a fresh block would stack under,
   * or a directive, which would then govern the block instead of the declaration.
   */
  private isDocBlockLineTaken(anchor: OxcNode, sourceText: string): boolean {
    const lineAbove = lineAboveOffset(sourceText, anchor.start);
    return lineAbove !== undefined && (isNoteLine(lineAbove) || isDirectiveLine(lineAbove));
  }

  private makeDeclarationSinceLine(
    anchor: OxcNode,
    existing: OxcComment | undefined,
    sourceText: string,
    version: string,
  ): TextEdit | undefined {
    if (existing) {
      if (this.jsDocHasSinceTag(existing)) {
        return undefined;
      }
      return this.makeJSDocSinceLine(existing.start, existing.end, sourceText, version);
    }

    const start = anchor.start;
    const indent = indentOfLineContaining(sourceText, start);
    return {
      start,
      end: start,
      replacement: `${indent}${this.makeSinceOnlyJSDocBlock(indent, version)}\n${indent}`,
    };
  }
}
