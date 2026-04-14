import path from "node:path";
import ts from "typescript";
import { applyEditsDescending, indentOfLineContaining } from "#lib/arrange";
import { walkTsxFiles } from "#lib/arrange";
import type { CodefastAfterWriteHook } from "#lib/config";
import { messageFromCaughtUnknown } from "#lib/infra/caught-unknown-message";
import type { CliFs } from "#lib/infra/fs-contract";
import type {
  TagFileResult,
  TagTargetCandidate,
  TagTargetSource,
  TagResolvedTarget,
  TagRunOptions,
  TagRunResult,
  TagSyncResult,
  TagSyncOptions,
  TagTargetExecutionResult,
} from "#lib/tag/domain/types";
import { resolveTagTargetCandidates } from "#lib/tag/infra/target-resolver";

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
  const rawBody = commentText.replace(/^\/\*\*\s?/, "").replace(/\s*\*\/$/, "");
  const normalizedBodyLines = rawBody
    .split("\n")
    .map((line) => line.replace(/^\s*\*\s?/, "").replace(/\s+$/, ""))
    .filter((line, lineIndex, lines) => {
      if (line.length > 0) return true;
      const hasNonEmptyBefore = lines.slice(0, lineIndex).some((value) => value.length > 0);
      const hasNonEmptyAfter = lines.slice(lineIndex + 1).some((value) => value.length > 0);
      return hasNonEmptyBefore && hasNonEmptyAfter;
    });

  const formattedBody =
    normalizedBodyLines.length > 0
      ? `${normalizedBodyLines.map((line) => `${baseIndent} * ${line}`).join("\n")}\n${baseIndent} *\n`
      : "";
  const replacement = `/**\n${formattedBody}${baseIndent} * ${VERSION_TAG} ${version}\n${baseIndent} */`;
  return { start: existingComment.pos, end: existingComment.end, replacement };
}

function makeSinceOnlyJSDocBlock(declarationIndent: string, version: string): string {
  return `/**\n${declarationIndent} * ${VERSION_TAG} ${version}\n${declarationIndent} */`;
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
    replacement: `${indent}${makeSinceOnlyJSDocBlock(indent, version)}\n${indent}`,
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
  hook: CodefastAfterWriteHook | undefined,
  modifiedFiles: string[],
): Promise<string | null> {
  if (!hook || modifiedFiles.length === 0) return null;
  try {
    await hook({ files: modifiedFiles });
    return null;
  } catch (caughtHookError: unknown) {
    return `[tag] onAfterWrite hook failed: ${messageFromCaughtUnknown(caughtHookError)}`;
  }
}

function summarizeVersions(targetResults: TagTargetExecutionResult[]): string {
  const distinctVersions = extractDistinctVersions(targetResults);
  if (distinctVersions.size === 0) {
    return "none";
  }
  if (distinctVersions.size > 1) {
    return "mixed";
  }
  return [...distinctVersions][0]!;
}

function extractDistinctVersions(targetResults: TagTargetExecutionResult[]): Set<string> {
  return new Set(
    targetResults
      .map((targetResult) => targetResult.result?.version)
      .filter((version): version is string => typeof version === "string" && version.length > 0),
  );
}

function chooseWorkspacePackageTargetPath(
  candidate: TagTargetCandidate,
  fs: CliFs,
): { targetPath: string; source: TagTargetSource } {
  if (candidate.source !== "workspace-package") {
    return {
      targetPath: candidate.candidatePath,
      source: candidate.source,
    };
  }

  const preferredSourceDir = path.join(candidate.candidatePath, "src");
  if (fs.existsSync(preferredSourceDir) && fs.statSync(preferredSourceDir).isDirectory()) {
    return {
      targetPath: preferredSourceDir,
      source: "workspace-package-selected-src",
    };
  }

  return {
    targetPath: candidate.candidatePath,
    source: "workspace-package-selected-root",
  };
}

function resolveTargetSelection(
  candidate: TagTargetCandidate,
  rootDir: string,
  fs: CliFs,
): TagResolvedTarget {
  const selectedTarget = chooseWorkspacePackageTargetPath(candidate, fs);
  const rootRelativeTargetPath = path
    .relative(rootDir, selectedTarget.targetPath)
    .split(path.sep)
    .join("/");
  return {
    targetPath: selectedTarget.targetPath,
    rootRelativeTargetPath: rootRelativeTargetPath || ".",
    source: selectedTarget.source,
    packageDir: candidate.packageDir,
    packageName: candidate.packageName,
  };
}

function filterSkippedCandidates(
  targetCandidates: TagTargetCandidate[],
  skipPackages: readonly string[] | undefined,
): { includedCandidates: TagTargetCandidate[]; skippedPackages: string[] } {
  if (!skipPackages || skipPackages.length === 0) {
    return {
      includedCandidates: targetCandidates,
      skippedPackages: [],
    };
  }

  const skipPackageSet = new Set(skipPackages);
  const includedCandidates: TagTargetCandidate[] = [];
  const skippedPackages: string[] = [];
  for (const candidate of targetCandidates) {
    const packageName = candidate.packageName;
    if (packageName && skipPackageSet.has(packageName)) {
      skippedPackages.push(packageName);
      continue;
    }
    includedCandidates.push(candidate);
  }

  return { includedCandidates, skippedPackages };
}

async function runOnResolvedTarget(
  resolvedTarget: TagResolvedTarget,
  write: boolean,
  fs: CliFs,
  listener: TagSyncOptions["listener"],
): Promise<TagTargetExecutionResult> {
  listener?.onTargetStarted(resolvedTarget);
  const absoluteTargetPath = path.resolve(resolvedTarget.targetPath);
  if (!fs.existsSync(absoluteTargetPath)) {
    const missingTargetResult: TagTargetExecutionResult = {
      target: resolvedTarget,
      targetExists: false,
      runError: `Not found: ${absoluteTargetPath}`,
      result: null,
    };
    listener?.onTargetCompleted(resolvedTarget, missingTargetResult);
    return missingTargetResult;
  }

  try {
    const runResult = runTagOnTarget(absoluteTargetPath, { write }, fs);
    const targetRunResult: TagTargetExecutionResult = {
      target: resolvedTarget,
      targetExists: true,
      runError: null,
      result: runResult,
    };
    listener?.onTargetCompleted(resolvedTarget, targetRunResult);
    return targetRunResult;
  } catch (caughtRunError: unknown) {
    const failedTargetRunResult: TagTargetExecutionResult = {
      target: resolvedTarget,
      targetExists: true,
      runError: messageFromCaughtUnknown(caughtRunError),
      result: null,
    };
    listener?.onTargetCompleted(resolvedTarget, failedTargetRunResult);
    return failedTargetRunResult;
  }
}

/**
 * CLI entry: run tagging and optional `onAfterWrite` using config injected by the command layer.
 * Returns structured execution data; presentation/logging belongs to command layer.
 */
export async function runTagSync(opts: TagSyncOptions): Promise<TagSyncResult> {
  const { fs } = opts;
  const targetCandidates = await resolveTagTargetCandidates(opts.rootDir, opts.targetPath, fs);
  const { includedCandidates, skippedPackages } = filterSkippedCandidates(
    targetCandidates,
    opts.skipPackages,
  );
  const selectedTargets = includedCandidates.map((candidate) =>
    resolveTargetSelection(candidate, opts.rootDir, fs),
  );
  const targetResults = await Promise.all(
    selectedTargets.map((resolvedTarget) =>
      runOnResolvedTarget(resolvedTarget, opts.write, fs, opts.listener),
    ),
  );

  const allFileResults: TagFileResult[] = targetResults.flatMap(
    (targetResult) => targetResult.result?.fileResults ?? [],
  );
  const filesScanned = targetResults.reduce(
    (sum, targetResult) => sum + (targetResult.result?.filesScanned ?? 0),
    0,
  );
  const filesChanged = targetResults.reduce(
    (sum, targetResult) => sum + (targetResult.result?.filesChanged ?? 0),
    0,
  );
  const taggedDeclarations = targetResults.reduce(
    (sum, targetResult) => sum + (targetResult.result?.taggedDeclarations ?? 0),
    0,
  );
  const modifiedFiles = allFileResults
    .filter((entry) => entry.changed)
    .map((entry) => entry.filePath);
  const hookError =
    opts.write && modifiedFiles.length > 0
      ? await runTagOnAfterWriteHook(opts.config?.onAfterWrite, modifiedFiles)
      : null;
  const distinctVersions = [...extractDistinctVersions(targetResults)].sort((left, right) =>
    left.localeCompare(right),
  );

  return {
    mode: opts.write ? "applied" : "dry-run",
    selectedTargets,
    resolvedTargets: selectedTargets,
    skippedPackages,
    targetResults,
    filesScanned,
    filesChanged,
    taggedDeclarations,
    versionSummary: summarizeVersions(targetResults),
    distinctVersions,
    modifiedFiles,
    hookError,
  };
}
