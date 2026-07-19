import { parseSync } from "oxc-parser";

import type { FilesystemPort } from "#/core/filesystem/port";
import { applyEditsDescending, indentOfLineContaining } from "#/core/source-text-edit";
import type { TagFileResult } from "#/tag/domain/types";

type TextEdit = {
  start: number;
  end: number;
  replacement: string;
};

interface OxcNode {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly [key: string]: unknown;
}

interface OxcComment {
  readonly type: "Block" | "Line";
  readonly value: string;
  readonly start: number;
  readonly end: number;
}

/**
 * Top-level statement kinds that carry a `@since` tag: function, class, interface,
 * type alias, enum, and variable declaration.
 */
const TAGGABLE_DECLARATION_TYPES = new Set([
  "FunctionDeclaration",
  "ClassDeclaration",
  "TSInterfaceDeclaration",
  "TSTypeAliasDeclaration",
  "TSEnumDeclaration",
  "VariableDeclaration",
]);

function isOxcNode(value: unknown): value is OxcNode {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

function identifierName(node: unknown): string | undefined {
  if (isOxcNode(node) && node.type === "Identifier" && typeof node.name === "string") {
    return node.name;
  }
  return undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export class TagSinceWriter {
  private readonly sinceDocumentationTag = "@since";

  constructor(private readonly fs: FilesystemPort) {}

  applySinceTagsToFile(filePath: string, version: string, write: boolean): TagFileResult {
    const sourceText = this.fs.readFileSync(filePath, "utf8");
    const { program, comments } = parseSync(filePath, sourceText);
    const statements = (program as unknown as { body: ReadonlyArray<OxcNode> }).body;
    const jsDocComments = (comments as ReadonlyArray<OxcComment>).filter(
      (comment) => comment.type === "Block" && comment.value.startsWith("*"),
    );

    const edits: Array<TextEdit> = [];
    for (const declaration of this.collectExportedDeclarations(statements)) {
      const edit = this.makeDeclarationSinceLine(declaration, jsDocComments, sourceText, version);
      if (edit) {
        edits.push(edit);
      }
    }

    if (edits.length > 0 && write) {
      const updated = applyEditsDescending(sourceText, edits);
      this.fs.writeFileSync(filePath, updated, "utf8");
    }

    return {
      filePath,
      taggedDeclarations: edits.length,
      changed: edits.length > 0,
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

  private makeDeclarationSinceLine(
    anchor: OxcNode,
    jsDocComments: ReadonlyArray<OxcComment>,
    sourceText: string,
    version: string,
  ): TextEdit | undefined {
    const existing = this.associatedJsDoc(anchor, jsDocComments, sourceText);
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
