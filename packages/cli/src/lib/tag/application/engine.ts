import path from "node:path";
import ts from "typescript";
import { applyEditsDescending, indentOfLineContaining } from "#lib/arrange";
import { walkTsxFiles } from "#lib/arrange";
import type { CodefastAfterWriteHook } from "#lib/config";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import type { CliFs, CliLogger } from "#lib/infra/fs-contract";
import type {
  TagFileResult,
  TagRunOptions,
  TagRunResult,
  TagSyncOptions,
} from "#lib/tag/domain/types";

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

const PACKAGE_JSON = "package.json";
const VERSION_TAG = "@since";

function hasExportModifier(node: ts.Node): boolean {
  const modifiers = ts.canHaveModifiers(node) ? ts.getModifiers(node) : undefined;
  return modifiers?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

function isTaggableDeclaration(node: ts.Statement): node is TaggableDeclaration {
  return (
    ts.isFunctionDeclaration(node) ||
    ts.isClassDeclaration(node) ||
    ts.isInterfaceDeclaration(node) ||
    ts.isTypeAliasDeclaration(node) ||
    ts.isEnumDeclaration(node) ||
    ts.isVariableStatement(node)
  );
}

function addDeclarationName(
  registry: Map<string, Set<TaggableDeclaration>>,
  name: string,
  declaration: TaggableDeclaration,
): void {
  if (!registry.has(name)) {
    registry.set(name, new Set([declaration]));
    return;
  }
  registry.get(name)!.add(declaration);
}

function collectLocalNamedDeclarations(sf: ts.SourceFile): Map<string, Set<TaggableDeclaration>> {
  const declarations = new Map<string, Set<TaggableDeclaration>>();
  for (const statement of sf.statements) {
    if (ts.isFunctionDeclaration(statement) && statement.name) {
      addDeclarationName(declarations, statement.name.text, statement);
      continue;
    }
    if (ts.isClassDeclaration(statement) && statement.name) {
      addDeclarationName(declarations, statement.name.text, statement);
      continue;
    }
    if (ts.isInterfaceDeclaration(statement)) {
      addDeclarationName(declarations, statement.name.text, statement);
      continue;
    }
    if (ts.isTypeAliasDeclaration(statement)) {
      addDeclarationName(declarations, statement.name.text, statement);
      continue;
    }
    if (ts.isEnumDeclaration(statement)) {
      addDeclarationName(declarations, statement.name.text, statement);
      continue;
    }
    if (!ts.isVariableStatement(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (ts.isIdentifier(declaration.name)) {
        addDeclarationName(declarations, declaration.name.text, statement);
      }
    }
  }
  return declarations;
}

function collectExportedDeclarations(sf: ts.SourceFile): Set<TaggableDeclaration> {
  const exported = new Set<TaggableDeclaration>();
  const localNamed = collectLocalNamedDeclarations(sf);

  for (const statement of sf.statements) {
    if (isTaggableDeclaration(statement) && hasExportModifier(statement)) {
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
        if (!declarations) continue;
        for (const declaration of declarations) {
          exported.add(declaration);
        }
      }
      continue;
    }

    if (!ts.isExportAssignment(statement) || !ts.isIdentifier(statement.expression)) continue;
    const declarations = localNamed.get(statement.expression.text);
    if (!declarations) continue;
    for (const declaration of declarations) {
      exported.add(declaration);
    }
  }

  return exported;
}

function makeJSDocSinceLine(
  existingComment: ts.JSDoc,
  sourceText: string,
  version: string,
): TextEdit {
  const commentText = sourceText.slice(existingComment.pos, existingComment.end);
  const baseIndent = indentOfLineContaining(sourceText, existingComment.pos);
  const closingLinePattern = /\n([ \t]*)\*\/\s*$/;
  if (commentText.includes("\n") && closingLinePattern.test(commentText)) {
    const replacement = commentText.replace(
      closingLinePattern,
      `\n${baseIndent} * ${VERSION_TAG} ${version}\n$1*/`,
    );
    return { start: existingComment.pos, end: existingComment.end, replacement };
  }

  const inner = commentText
    .replace(/^\/\*\*\s?/, "")
    .replace(/\s*\*\/$/, "")
    .trim();
  const innerLine = inner.length > 0 ? ` ${inner}` : "";
  const replacement = `/**${innerLine}\n${baseIndent} * ${VERSION_TAG} ${version}\n${baseIndent} */`;
  return { start: existingComment.pos, end: existingComment.end, replacement };
}

function makeDeclarationSinceLine(
  declaration: TaggableDeclaration,
  sf: ts.SourceFile,
  sourceText: string,
  version: string,
): TextEdit | undefined {
  const jsDocTags = ts.getJSDocTags(declaration);
  if (jsDocTags.some((tag) => tag.tagName.text === "since")) return undefined;

  const jsDocComments = ts.getJSDocCommentsAndTags(declaration).filter(ts.isJSDoc);
  const lastJsDoc = jsDocComments.at(-1);
  if (lastJsDoc) {
    return makeJSDocSinceLine(lastJsDoc, sourceText, version);
  }

  const start = declaration.getStart(sf);
  const indent = indentOfLineContaining(sourceText, start);
  return {
    start,
    end: start,
    replacement: `${indent}/** ${VERSION_TAG} ${version} */\n${indent}`,
  };
}

function applySinceTagsToFile(
  filePath: string,
  version: string,
  fs: CliFs,
  write: boolean,
): TagFileResult {
  const sourceText = fs.readFileSync(filePath, "utf8");
  const sf = ts.createSourceFile(
    filePath,
    sourceText,
    ts.ScriptTarget.Latest,
    true,
    filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS,
  );

  const edits: TextEdit[] = [];
  for (const declaration of collectExportedDeclarations(sf)) {
    const edit = makeDeclarationSinceLine(declaration, sf, sourceText, version);
    if (edit) edits.push(edit);
  }

  if (edits.length > 0 && write) {
    const updated = applyEditsDescending(sourceText, edits);
    fs.writeFileSync(filePath, updated, "utf8");
  }

  return {
    filePath,
    taggedDeclarations: edits.length,
    changed: edits.length > 0,
  };
}

export function resolveNearestPackageVersion(targetPath: string, fs: CliFs): string {
  const resolved = path.resolve(targetPath);
  const startDir = fs.statSync(resolved).isDirectory() ? resolved : path.dirname(resolved);

  let current = startDir;
  while (true) {
    const packageJsonPath = path.join(current, PACKAGE_JSON);
    if (fs.existsSync(packageJsonPath)) {
      const raw = fs.readFileSync(packageJsonPath, "utf8");
      const version = (JSON.parse(raw) as { version?: unknown }).version;
      if (typeof version === "string" && version.length > 0) return version;
      throw new Error(`Missing or invalid version in ${packageJsonPath}`);
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error(`Unable to locate ${PACKAGE_JSON} from target: ${targetPath}`);
}

export function runTagOnTarget(targetPath: string, opts: TagRunOptions, fs: CliFs): TagRunResult {
  const resolvedTarget = path.resolve(targetPath);
  const version = resolveNearestPackageVersion(resolvedTarget, fs);

  const files = fs.statSync(resolvedTarget).isDirectory()
    ? walkTsxFiles(resolvedTarget, fs)
    : [resolvedTarget];
  const tsFiles = files.filter((filePath) => filePath.endsWith(".ts") || filePath.endsWith(".tsx"));

  const fileResults = tsFiles.map((filePath) =>
    applySinceTagsToFile(filePath, version, fs, opts.write),
  );
  const filesChanged = fileResults.filter((result) => result.changed).length;
  const taggedDeclarations = fileResults.reduce(
    (sum, result) => sum + result.taggedDeclarations,
    0,
  );

  return {
    version,
    filesScanned: tsFiles.length,
    filesChanged,
    taggedDeclarations,
    fileResults,
  };
}

async function runTagOnAfterWriteHook(
  logger: CliLogger,
  hook: CodefastAfterWriteHook | undefined,
  modifiedFiles: string[],
): Promise<void> {
  if (!hook || modifiedFiles.length === 0) return;
  try {
    await hook({ files: modifiedFiles });
  } catch (caughtHookError: unknown) {
    logger.err(`[tag] onAfterWrite hook failed: ${messageFromCaughtUnknown(caughtHookError)}`);
  }
}

/**
 * CLI entry: run tagging and optional `onAfterWrite` using config injected by the command layer.
 * @returns Process exit code (`0` or `1` when the target path is missing).
 */
export async function runTagSync(opts: TagSyncOptions): Promise<number> {
  void opts.rootDir;
  const { fs, logger } = opts;
  const resolvedTarget = path.resolve(opts.targetPath);

  if (!fs.existsSync(resolvedTarget)) {
    logger.err(`Not found: ${resolvedTarget}`);
    return 1;
  }

  const result = runTagOnTarget(resolvedTarget, { write: opts.write }, fs);
  const mode = opts.write ? "applied" : "dry-run";
  logger.out(
    `[tag:${mode}] version=${result.version} files=${result.filesChanged}/${result.filesScanned} declarations=${result.taggedDeclarations}`,
  );

  if (!opts.write || result.filesChanged === 0) {
    return 0;
  }

  const modifiedFiles = result.fileResults
    .filter((entry) => entry.changed)
    .map((entry) => entry.filePath);

  await runTagOnAfterWriteHook(logger, opts.config?.onAfterWrite, modifiedFiles);
  return 0;
}
