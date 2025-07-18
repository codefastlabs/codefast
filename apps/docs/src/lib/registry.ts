import { promises as fs } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { isEmpty } from "lodash-es";
import { Project, ScriptKind } from "ts-morph";
import type { SourceFile } from "ts-morph";

import type { RegistryItem, RegistryItemFile } from "@/types/registry";

import { highlightCode } from "@/lib/highlight-code";
import { registryBlocks } from "@/registry/registry-blocks";

// Constants
const FILE_TYPES = {
  BLOCK: "registry:block",
  COMPONENT: "registry:component",
  FILE: "registry:file",
  PAGE: "registry:page",
};

enum TargetPrefixes {
  APP = "app/",
  COMPONENT = "components/",
}

const VARIABLES_TO_REMOVE = ["iframeHeight", "containerClassName", "description"];

// Pre-compile regex pattern for better performance
const IMPORT_REGEX =
  /import\s+(?:(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+)?["'](?<importPath>[^"']+)["']/g;

// In-memory cache for processed files
const fileContentCache = new Map<string, { content: string; highlightedContent: string }>();
const sourceFileCache = new Map<string, SourceFile>();
const tempDirectories = new Set<string>();

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
 */
export async function getRegistryItem(name: string): Promise<null | RegistryItem> {
  try {
    const item = registryBlocks[name];

    if (isEmpty(item) || !item.files) {
      return null;
    }

    const files = await processRegistryItemFiles(item.files);

    return {
      ...item,
      files,
    };
  } catch (error) {
    console.error(`Error retrieving registry item '${name}':`, error);

    return null;
  } finally {
    // Clean up all temp directories
    await cleanupTempDirectories();
  }
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
async function processRegistryItemFiles(
  itemFiles: RegistryItemFile[],
): Promise<RegistryItemFile[]> {
  const files: RegistryItemFile[] = itemFiles.map((file) => ({
    ...file,
    path: path.join(process.cwd(), file.path),
    target: determineFileTarget(file),
  }));

  // Process files in parallel for better performance
  await Promise.all(
    files.map(async (file) => {
      try {
        const { content, highlightedContent } = await getFileContentWithHighlighting(file, files);

        Object.assign(file, { content, highlightedContent });
      } catch (error) {
        console.error(`Error processing file '${file.path}':`, error);
        Object.assign(file, {
          content: `// Error processing file: ${file.path}`,
          highlightedContent: `// Error processing file: ${file.path}`,
        });
      }
    }),
  );

  return files;
}

/**
 * Gets file content and its highlighted version, utilizing caching
 *
 * @param file - The registry item file to process
 * @param allFiles - Array of all registry item files
 * @returns Promise resolving to content and highlighted content
 */
async function getFileContentWithHighlighting(
  file: RegistryItemFile,
  allFiles: RegistryItemFile[],
): Promise<{ content: string; highlightedContent: string }> {
  const cacheKey = file.path;

  if (fileContentCache.has(cacheKey)) {
    const cached = fileContentCache.get(cacheKey);

    if (cached) {
      return cached;
    }
  }

  const content = await getFileContent(file, allFiles);
  const highlightedContent = await highlightCode(content);

  const result = { content, highlightedContent };

  fileContentCache.set(cacheKey, result);

  return result;
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

  const fileName = file.path.split("/").pop() ?? "";

  if (file.type === FILE_TYPES.BLOCK || file.type === FILE_TYPES.COMPONENT) {
    return `${TargetPrefixes.COMPONENT}${fileName}`;
  }

  if (file.type === FILE_TYPES.PAGE || file.type === FILE_TYPES.FILE) {
    return `${TargetPrefixes.APP}${fileName}`;
  }

  return "";
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

    if (!filePath) {
      continue;
    }

    const parts = filePath.split("/");
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
function findOrCreateNode(
  level: FileTree[],
  nodeName: string,
  isFile: boolean,
  filePath?: string,
): FileTree {
  let node = level.find(({ name }) => name === nodeName);

  if (!node) {
    node = isFile ? { name: nodeName, path: filePath } : { children: [], name: nodeName };
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
async function getFileContent(
  file: RegistryItemFile,
  allFiles: RegistryItemFile[],
): Promise<string> {
  try {
    const raw = await fs.readFile(file.path, "utf8");
    const sourceFile = await createProcessedSourceFile(file.path, raw);
    const code = sourceFile.getFullText();

    return fixImports(code, file, allFiles);
  } catch (error) {
    console.error(`Error getting content for file '${file.path}':`, error);

    return `// Error processing file: ${file.path}`;
  }
}

/**
 * Creates and processes a temporary source file to apply transformations.
 *
 * @param filePath - Path of the original file
 * @param content - Raw file content to process
 * @returns Promise resolving to the processed SourceFile object
 */
async function createProcessedSourceFile(filePath: string, content: string): Promise<SourceFile> {
  const cacheKey = `${filePath}:${content.length.toString()}`;

  if (sourceFileCache.has(cacheKey)) {
    const cached = sourceFileCache.get(cacheKey);

    if (cached) {
      return cached;
    }
  }

  const project = new Project({ compilerOptions: {} });
  const tempFile = await createTempSourceFile(filePath);

  const sourceFile = project.createSourceFile(tempFile, content, {
    scriptKind: ScriptKind.TSX,
  });

  // Remove unnecessary variables
  for (const variableName of VARIABLES_TO_REMOVE) {
    removeVariable(sourceFile, variableName);
  }

  sourceFileCache.set(cacheKey, sourceFile);

  return sourceFile;
}

/**
 * Creates a temporary source file for processing in a system temp directory.
 *
 * @param filename - The original filename to use in the temporary location
 * @returns Promise resolving to the path of the created temporary file
 */
async function createTempSourceFile(filename: string): Promise<string> {
  const directory = await fs.mkdtemp(path.join(tmpdir(), "codefast-ui-"));

  tempDirectories.add(directory);

  return path.join(directory, path.basename(filename));
}

/**
 * Cleans up all temporary directories created during processing
 */
async function cleanupTempDirectories(): Promise<void> {
  const cleanupPromises = [...tempDirectories].map(async (directory) => {
    try {
      await fs.rm(directory, { force: true, recursive: true });
      tempDirectories.delete(directory);
    } catch (error) {
      console.error(`Error cleaning up temp directory '${directory}':`, error);
    }
  });

  await Promise.all(cleanupPromises);
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

  return content.replaceAll(IMPORT_REGEX, (match: string, importPath: string) => {
    if (
      !importPath.startsWith("@/") &&
      !importPath.startsWith("./") &&
      !importPath.startsWith("../")
    ) {
      return match;
    }

    if (importPath.startsWith("@/")) {
      return processAliasImport(match, importPath, allFiles);
    }

    if (importPath.startsWith("./") || importPath.startsWith("../")) {
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
function processAliasImport(
  match: string,
  importPath: string,
  allFiles: RegistryItemFile[],
): string {
  const importPathWithoutAlias = importPath.replace("@/", "");
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
  const currentDirectory = path.dirname(file.path);
  const absoluteImportPath = path.resolve(currentDirectory, importPath);
  const importedFile = allFiles.find((f) =>
    absoluteImportPath.includes(path.basename(f.path, path.extname(f.path))),
  );

  if (importedFile?.target) {
    return match.replace(importPath, `@/${importedFile.target}`);
  }

  return match;
}
