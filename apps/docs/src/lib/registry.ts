import type { SourceFile } from 'ts-morph';

import { isEmpty } from 'lodash-es';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Project, ScriptKind } from 'ts-morph';

import type { RegistryItem, RegistryItemFile } from '@/types/registry';

import { highlightCode } from '@/lib/highlight-code';
import { registryBlocks } from '@/registry/registry-blocks';

// Constants
const FILE_TYPES = {
  BLOCK: 'registry:block',
  COMPONENT: 'registry:component',
  FILE: 'registry:file',
  PAGE: 'registry:page',
};

enum TargetPrefixes {
  APP = 'app/',
  COMPONENT = 'components/',
}

const VARIABLES_TO_REMOVE = ['iframeHeight', 'containerClassName', 'description'];

/**
 * Represents a node in the file tree structure.
 */
export interface FileTree {
  /** The name of the node (file or directory name) */
  name: string;

  /** Array of child nodes (applicable only for directories) */
  children?: FileTree[];

  /** Full path to the file (applicable only for files) */
  path?: string;
}

/**
 * Retrieves and processes a registry item by its identifier name.
 *
 * @param name - The identifier name of the registry item to retrieve
 * @returns A Promise that resolves to the processed RegistryItem or null if not found
 * @example
 * ```ts
 * const item = await getRegistryItem("button");
 * if (item) {
 *   console.log(item.files);
 * }
 * ```
 */
export async function getRegistryItem(name: string): Promise<null | RegistryItem> {
  const item = registryBlocks[name];

  if (isEmpty(item) || !item.files) {
    return null;
  }

  const files = await processRegistryItemFiles(item.files);

  return {
    ...item,
    files,
  };
}

/**
 * Processes registry item files by resolving targets and content.
 *
 * This function:
 * 1. Maps files to determine their target paths
 * 2. Retrieves content for each file
 * 3. Highlights code for display purposes
 *
 * @param itemFiles - Array of registry item files to process
 * @returns Promise resolving to an array of processed files with content and target paths
 */
async function processRegistryItemFiles(itemFiles: RegistryItemFile[]): Promise<RegistryItemFile[]> {
  const files: RegistryItemFile[] = itemFiles.map((file) => ({
    ...file,
    target: determineFileTarget(file),
  }));

  for (const file of files) {
    const content = await getFileContent(file, files);
    const highlightedContent = await highlightCode(content);

    Object.assign(file, { content, highlightedContent });
  }

  return files;
}

/**
 * Determines the appropriate target path for a file based on its type.
 *
 * @param file - The registry item file to determine target for
 * @returns The target path string for the file
 */
function determineFileTarget(file: RegistryItemFile): string {
  if (file.target) {
    return file.target;
  }

  const fileName = file.path.split('/').pop() ?? '';

  if (file.type === FILE_TYPES.BLOCK || file.type === FILE_TYPES.COMPONENT) {
    return `${TargetPrefixes.COMPONENT}${fileName}`;
  }

  if (file.type === FILE_TYPES.PAGE || file.type === FILE_TYPES.FILE) {
    return `${TargetPrefixes.APP}${fileName}`;
  }

  return '';
}

/**
 * Creates a hierarchical file tree structure from registry item files.
 *
 * @param files - Array of registry item files to organize into a tree
 * @returns Array of root-level FileTree nodes representing the file hierarchy
 */
export function createFileTreeForRegistryItemFiles(files: RegistryItemFile[]): FileTree[] {
  const root: FileTree[] = [];

  for (const file of files) {
    const filePath = file.target ?? file.path;
    const parts = filePath.split('/');
    let currentLevel = root;

    for (let index = 0; index < parts.length; index++) {
      const part = parts[index];
      const isFile = index === parts.length - 1;
      const node = findOrCreateNode(currentLevel, part, isFile, isFile ? filePath : undefined);

      if (isFile) {
        node.path = filePath;
      } else {
        currentLevel = node.children ?? [];
      }
    }
  }

  return sortFileTreeByName(root);
}

/**
 * Finds an existing node in the file tree or creates a new one if not found.
 *
 * @param level - Array of current sibling nodes at this level
 * @param nodeName - Name of the node to find or create
 * @param isFile - Flag indicating whether this node is a file or directory
 * @param filePath - Full file path, applicable only when isFile is true
 * @returns The found or newly created node
 */
function findOrCreateNode(level: FileTree[], nodeName: string, isFile: boolean, filePath?: string): FileTree {
  let node = level.find(({ name }) => name === nodeName);

  if (!node) {
    node = isFile ? { name: nodeName, path: filePath } : { name: nodeName, children: [] };
    level.push(node);
  }

  return node;
}

/**
 * Sorts file tree nodes by name recursively through the entire tree.
 *
 * @param fileTree - Array of file tree nodes to sort
 * @returns New sorted array of file tree nodes
 */
function sortFileTreeByName(fileTree: FileTree[]): FileTree[] {
  const sorted = [...fileTree].sort((a, b) => a.name.localeCompare(b.name));

  for (const node of sorted) {
    if (node.children && node.children.length > 0) {
      node.children = sortFileTreeByName(node.children);
    }
  }

  return sorted;
}

/**
 * Processes and retrieves content for a file, applying the necessary transformations.
 *
 * @param file - The registry item file to get content for
 * @param allFiles - Array of all registry item files for import resolution
 * @returns Promise resolving to the processed file content as string
 */
async function getFileContent(file: RegistryItemFile, allFiles: RegistryItemFile[]): Promise<string> {
  const raw = await fs.readFile(file.path, 'utf8');
  const sourceFile = await createProcessedSourceFile(file.path, raw);
  const code = sourceFile.getFullText();

  return fixImports(code, file, allFiles);
}

/**
 * Creates and processes a temporary source file to apply transformations.
 *
 * @param filePath - Path of the original file
 * @param content - Raw file content to process
 * @returns Promise resolving to the processed SourceFile object
 */
async function createProcessedSourceFile(filePath: string, content: string): Promise<SourceFile> {
  const project = new Project({ compilerOptions: {} });
  const tempFile = await createTempSourceFile(filePath);

  const sourceFile = project.createSourceFile(tempFile, content, {
    scriptKind: ScriptKind.TSX,
  });

  // Remove unnecessary variables
  for (const varName of VARIABLES_TO_REMOVE) {
    removeVariable(sourceFile, varName);
  }

  return sourceFile;
}

/**
 * Creates a temporary source file for processing in a system temp directory.
 *
 * @param filename - The original filename to use in the temporary location
 * @returns Promise resolving to the path of the created temporary file
 */
async function createTempSourceFile(filename: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'codefast-ui-'));

  return path.join(dir, filename);
}

/**
 * Removes a variable declaration from a source file.
 *
 * @param sourceFile - The source file to modify
 * @param name - Name of the variable to remove
 */
function removeVariable(sourceFile: SourceFile, name: string): void {
  sourceFile.getVariableDeclaration(name)?.remove();
}

/**
 * Fixes import paths in file content to ensure proper resolution.
 *
 * @param content - File content with imports to fix
 * @param file - The current registry item file
 * @param allFiles - Array of all registry item files for path resolution
 * @returns The file content with corrected import paths
 */
function fixImports(content: string, file: RegistryItemFile, allFiles: RegistryItemFile[]): string {
  if (!file.target || allFiles.length === 0) {
    return content;
  }

  const importRegex = /import\s+(?:(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+)?["'](?<importPath>[^"']+)["']/g;

  return content.replaceAll(importRegex, (match: string, importPath: string) => {
    if (!importPath.startsWith('@/') && !importPath.startsWith('./') && !importPath.startsWith('../')) {
      return match;
    }

    if (importPath.startsWith('@/')) {
      return processAliasImport(match, importPath, allFiles);
    }

    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      return processRelativeImport(match, importPath, file, allFiles);
    }

    return match;
  });
}

/**
 * Processes an alias import path (starting with '\@/') to ensure proper resolution.
 *
 * @param match - The original import statement text
 * @param importPath - The import path to process
 * @param allFiles - Array of all registry item files for path resolution
 * @returns The updated import statement with a corrected path
 */
function processAliasImport(match: string, importPath: string, allFiles: RegistryItemFile[]): string {
  const importPathWithoutAlias = importPath.replace('@/', '');
  const importedFile = allFiles.find(
    (f) => f.path.includes(importPathWithoutAlias) || f.target?.includes(importPathWithoutAlias),
  );

  if (importedFile?.target) {
    return match.replace(importPath, `@/${importedFile.target}`);
  }

  return match;
}

/**
 * Processes a relative import path (starting with './' or '../') to ensure proper resolution.
 *
 * @param match - The original import statement text
 * @param importPath - The relative import path to process
 * @param file - The current registry item file containing the import
 * @param allFiles - Array of all registry item files for path resolution
 * @returns The updated import statement with a corrected path
 */
function processRelativeImport(
  match: string,
  importPath: string,
  file: RegistryItemFile,
  allFiles: RegistryItemFile[],
): string {
  const currentDir = path.dirname(file.path);
  const absoluteImportPath = path.resolve(currentDir, importPath);
  const importedFile = allFiles.find((f) => absoluteImportPath.includes(path.basename(f.path, path.extname(f.path))));

  if (importedFile?.target) {
    return match.replace(importPath, `@/${importedFile.target}`);
  }

  return match;
}
