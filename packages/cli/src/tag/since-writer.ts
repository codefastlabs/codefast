import ts from "typescript";
import type { FilesystemPort } from "#/core/filesystem/port";
import { applyEditsDescending, indentOfLineContaining } from "#/core/source-text-edit";
import type { TagFileResult } from "#/tag/domain/types";

type TextEdit = {
  start: number;
  end: number;
  replacement: string;
};

type TaggableDeclaration =
  | ts.FunctionDeclaration
  | ts.ClassDeclaration
  | ts.InterfaceDeclaration
  | ts.TypeAliasDeclaration
  | ts.EnumDeclaration
  | ts.VariableStatement;

/**
 * @since 0.3.16-canary.0
 */
export class TagSinceWriter {
  private readonly sinceDocumentationTag = "@since";

  constructor(private readonly fs: FilesystemPort) {}

  applySinceTagsToFile(filePath: string, version: string, write: boolean): TagFileResult {
    const sourceText = this.fs.readFileSync(filePath, "utf8");
    const sf = ts.createSourceFile(
      filePath,
      sourceText,
      ts.ScriptTarget.Latest,
      true,
      filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
    );

    const edits: TextEdit[] = [];
    for (const declaration of this.collectExportedDeclarations(sf)) {
      const edit = this.makeDeclarationSinceLine(declaration, sf, sourceText, version);
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

  private hasExportModifier(node: ts.Node): boolean {
    const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
    return modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
  }

  private isTaggableDeclaration(node: ts.Statement): node is TaggableDeclaration {
    return (
      ts.isFunctionDeclaration(node) ||
      ts.isClassDeclaration(node) ||
      ts.isInterfaceDeclaration(node) ||
      ts.isTypeAliasDeclaration(node) ||
      ts.isEnumDeclaration(node) ||
      ts.isVariableStatement(node)
    );
  }

  private addDeclarationName(
    registry: Map<string, Set<TaggableDeclaration>>,
    name: string,
    declaration: TaggableDeclaration,
  ): void {
    if (!registry.has(name)) {
      registry.set(name, new Set([declaration]));
      return;
    }
    const bucket = registry.get(name);
    if (bucket === undefined) {
      throw new Error(`declaration registry missing set for ${name}`);
    }
    bucket.add(declaration);
  }

  private collectLocalNamedDeclarations(sf: ts.SourceFile): Map<string, Set<TaggableDeclaration>> {
    const declarations = new Map<string, Set<TaggableDeclaration>>();
    for (const statement of sf.statements) {
      if (ts.isFunctionDeclaration(statement) && statement.name) {
        this.addDeclarationName(declarations, statement.name.text, statement);
        continue;
      }
      if (ts.isClassDeclaration(statement) && statement.name) {
        this.addDeclarationName(declarations, statement.name.text, statement);
        continue;
      }
      if (ts.isInterfaceDeclaration(statement)) {
        this.addDeclarationName(declarations, statement.name.text, statement);
        continue;
      }
      if (ts.isTypeAliasDeclaration(statement)) {
        this.addDeclarationName(declarations, statement.name.text, statement);
        continue;
      }
      if (ts.isEnumDeclaration(statement)) {
        this.addDeclarationName(declarations, statement.name.text, statement);
        continue;
      }
      if (!ts.isVariableStatement(statement)) {
        continue;
      }
      for (const declaration of statement.declarationList.declarations) {
        if (ts.isIdentifier(declaration.name)) {
          this.addDeclarationName(declarations, declaration.name.text, statement);
        }
      }
    }
    return declarations;
  }

  private collectExportedDeclarations(sf: ts.SourceFile): Set<TaggableDeclaration> {
    const exported = new Set<TaggableDeclaration>();
    const localNamed = this.collectLocalNamedDeclarations(sf);

    for (const statement of sf.statements) {
      if (this.isTaggableDeclaration(statement) && this.hasExportModifier(statement)) {
        exported.add(statement);
        continue;
      }

      if (
        ts.isExportDeclaration(statement) &&
        !statement.moduleSpecifier &&
        statement.exportClause &&
        ts.isNamedExports(statement.exportClause)
      ) {
        for (const element of statement.exportClause.elements) {
          const localName = element.propertyName?.text ?? element.name.text;
          const declarations = localNamed.get(localName);
          if (!declarations) {
            continue;
          }
          for (const declaration of declarations) {
            exported.add(declaration);
          }
        }
        continue;
      }

      if (!ts.isExportAssignment(statement) || !ts.isIdentifier(statement.expression)) {
        continue;
      }
      const declarations = localNamed.get(statement.expression.text);
      if (!declarations) {
        continue;
      }
      for (const declaration of declarations) {
        exported.add(declaration);
      }
    }

    return exported;
  }

  private makeJSDocSinceLine(
    existingComment: ts.JSDoc,
    sourceText: string,
    version: string,
  ): TextEdit {
    const commentText = sourceText.slice(existingComment.pos, existingComment.end);
    const baseIndent = indentOfLineContaining(sourceText, existingComment.pos);
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
    return { start: existingComment.pos, end: existingComment.end, replacement };
  }

  private makeSinceOnlyJSDocBlock(declarationIndent: string, version: string): string {
    const tag = this.sinceDocumentationTag;
    return `/**\n${declarationIndent} * ${tag} ${version}\n${declarationIndent} */`;
  }

  private makeDeclarationSinceLine(
    declaration: TaggableDeclaration,
    sf: ts.SourceFile,
    sourceText: string,
    version: string,
  ): TextEdit | undefined {
    const jsDocTags = ts.getJSDocTags(declaration);
    if (jsDocTags.some((tag) => tag.tagName.text === "since")) {
      return undefined;
    }

    const jsDocComments = ts.getJSDocCommentsAndTags(declaration).filter(ts.isJSDoc);
    const lastJsDoc = jsDocComments.at(-1);
    if (lastJsDoc) {
      return this.makeJSDocSinceLine(lastJsDoc, sourceText, version);
    }

    const start = declaration.getStart(sf);
    const indent = indentOfLineContaining(sourceText, start);
    return {
      start,
      end: start,
      replacement: `${indent}${this.makeSinceOnlyJSDocBlock(indent, version)}\n${indent}`,
    };
  }
}
