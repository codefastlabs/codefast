import type { SourceFile } from 'ts-morph';

import { isEmpty } from 'lodash-es';
import { promises as fs } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { Project, ScriptKind } from 'ts-morph';

import type { RegistryItem, RegistryItemFile } from '@/types/registry';

import { highlightCode } from '@/lib/highlight-code';
import { registryBlocks } from '@/registry/registry-blocks';

export interface FileTree {
  name: string;
  children?: FileTree[];
  path?: string;
}

export async function getRegistryItem(name: string): Promise<null | RegistryItem> {
  const item = registryBlocks[name];

  if (isEmpty(item) || !item.files) {
    return null;
  }

  const files: RegistryItemFile[] = [];

  for (const file of item.files) {
    const target = getFileTarget(file);

    files.push({ ...file, target });
  }

  for (const file of files) {
    const content = await getFileContent(file, files);
    const highlightedContent = await highlightCode(content);

    Object.assign(file, { content, highlightedContent });
  }

  return {
    ...item,
    files,
  };
}

function getFileTarget(file: RegistryItemFile): string {
  let target = file.target;

  if (!target || target === '') {
    const fileName = file.path.split('/').pop();

    if (file.type === 'registry:block' || file.type === 'registry:component') {
      target = `components/${fileName}`;
    }

    if (file.type === 'registry:page' || file.type === 'registry:file') {
      target = `app/${fileName}`;
    }
  }

  return target ?? '';
}

function createNode(name: string, isFile: boolean, filePath?: string): FileTree {
  return isFile ? { name, path: filePath } : { name, children: [] };
}

function findOrCreateNode(level: FileTree[], nodeName: string, isFile: boolean, filePath?: string): FileTree {
  let node = level.find(({ name }) => name === nodeName);

  if (!node) {
    node = createNode(nodeName, isFile, filePath);
    level.push(node);
  }

  return node;
}

function sortFileTreeByName(fileTree: FileTree[]): FileTree[] {
  const sorted = [...fileTree].sort((a, b) => a.name.localeCompare(b.name));

  for (const node of sorted) {
    if (node.children && node.children.length > 0) {
      node.children = sortFileTreeByName(node.children);
    }
  }

  return sorted;
}

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

async function getFileContent(file: RegistryItemFile, allFiles?: RegistryItemFile[]): Promise<string> {
  const raw = await fs.readFile(file.path, 'utf8');

  const project = new Project({
    compilerOptions: {},
  });

  const tempFile = await createTempSourceFile(file.path);

  const sourceFile = project.createSourceFile(tempFile, raw, {
    scriptKind: ScriptKind.TSX,
  });

  removeVariable(sourceFile, 'iframeHeight');
  removeVariable(sourceFile, 'containerClassName');
  removeVariable(sourceFile, 'description');

  let code = sourceFile.getFullText();

  code = fixImport(code, file, allFiles);

  return code;
}

async function createTempSourceFile(filename: string): Promise<string> {
  const dir = await fs.mkdtemp(path.join(tmpdir(), 'codefast-ui-'));

  return path.join(dir, filename);
}

function removeVariable(sourceFile: SourceFile, name: string): void {
  sourceFile.getVariableDeclaration(name)?.remove();
}

function fixImport(content: string, file?: RegistryItemFile, allFiles?: RegistryItemFile[]): string {
  if (!file?.target || !allFiles?.length) {
    return content;
  }

  const importRegex = /import\s+(?:(?:{[^}]+}|\*\s+as\s+\w+|\w+)\s+from\s+)?["'](?<importPath>[^"']+)["']/g;

  return content.replaceAll(importRegex, (match: string, importPath: string) => {
    if (!importPath.startsWith('@/') && !importPath.startsWith('./') && !importPath.startsWith('../')) {
      return match;
    }

    if (importPath.startsWith('@/')) {
      const importPathWithoutAlias = importPath.replace('@/', '');
      const importedFile = allFiles.find(
        (f) => f.path.includes(importPathWithoutAlias) || f.target?.includes(importPathWithoutAlias),
      );

      if (importedFile?.target) {
        return match.replace(importPath, `@/${importedFile.target}`);
      }

      return match;
    }

    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      const currentDir = path.dirname(file.path);
      const absoluteImportPath = path.resolve(currentDir, importPath);

      const importedFile = allFiles.find((f) =>
        absoluteImportPath.includes(path.basename(f.path, path.extname(f.path))),
      );

      if (importedFile?.target) {
        return match.replace(importPath, `@/${importedFile.target}`);
      }

      return match;
    }

    return match;
  });
}
