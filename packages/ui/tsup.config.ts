import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'tsup';

const componentsDir = path.resolve(__dirname, './dist/components');
const clientLibs = [
  '@radix-ui/react-context',
  '@radix-ui/primitive',
  'react-resizable-panels',
  'input-otp',
  'cmdk',
  'vaul',
];

/**
 * Analyzes the specified file for client directives, custom hooks, and client libraries.
 *
 * @param filePath - The path to the file to be analyzed.
 * @returns An object containing the file content, a flag indicating if a client directive is present,
 * and a flag indicating if custom client hooks or libraries are present.
 */
async function analyzeFile(
  filePath: string,
): Promise<{ content: string; hasClientDirective: boolean; hasClientLibsOrHooks: boolean }> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const hasClientDirective = content.includes('"use client"');
    const containsCustomHooks = /\buse[A-Z][a-zA-Z]*\s*\(.*\)/.test(content);
    const containsClientLibs = clientLibs.some((lib) => content.includes(lib));

    return {
      hasClientDirective,
      hasClientLibsOrHooks: containsClientLibs || containsCustomHooks,
      content,
    };
  } catch (error) {
    // eslint-disable-next-line no-console -- We want to log the error
    console.error(`Error reading file ${filePath}:`, error);

    return { hasClientDirective: false, hasClientLibsOrHooks: false, content: '' };
  }
}

/**
 * Adds the "use client" directive to the beginning of the provided content and writes it to the specified file.
 * Skips processing if the content already starts with the "use client" directive.
 *
 * @param filePath - The path to the file where the content should be written.
 * @param content - The content to which the "use client" directive should be added.
 * @returns A promise that resolves when the file has been written.
 */
async function addUseClientDirective(filePath: string, content: string): Promise<void> {
  if (content.startsWith('"use client"')) {
    return; // Skip if already has "use client"
  }

  await fs.writeFile(filePath, `"use client";${content}`, 'utf-8');
}

/**
 * Analyzes a component by examining its import statements to determine if
 * they contain client-side libraries or hooks, and adds `useClient` directives if needed.
 *
 * @param componentPath - The file path of the component to analyze.
 * @returns A promise that resolves when the analysis is complete.
 */
async function analyzeComponent(componentPath: string): Promise<void> {
  try {
    const { content } = await analyzeFile(componentPath);
    const importRegex = /import[\s\S]*?from\s*['"](?<path>[^'"]+)['"]/g;
    const requireRegex = /require\(['"](?<path>[^'"]+)['"]\)/g;
    let match;

    // Analyze ES module imports and CommonJS requires
    while ((match = importRegex.exec(content)) !== null || (match = requireRegex.exec(content)) !== null) {
      const importedPath = match.groups?.path;

      if (!importedPath) {
        continue; // Skip if no imported path
      }

      const fullChunkPath = path.resolve(path.dirname(componentPath), importedPath);
      const { hasClientLibsOrHooks, content: importedContent } = await analyzeFile(fullChunkPath);

      if (hasClientLibsOrHooks) {
        await addUseClientDirective(fullChunkPath, importedContent);
      }
    }
  } catch (error) {
    // eslint-disable-next-line no-console -- We want to log the error
    console.error(`Error analyzing component ${componentPath}:`, error);
  }
}

/**
 * Updates client directives in all JavaScript and CommonJS components within the specified directory.
 *
 * This function reads the contents of the components directory, identifies JavaScript and CommonJS files,
 * and performs an analysis on each file to check for the presence of client directives. If a client
 * directive is found, it further analyzes the component. The processing of files is done concurrently.
 *
 * @returns A promise that resolves when all components have been processed.
 */
async function updateClientDirectivesInComponents(): Promise<void> {
  try {
    const files = await fs.readdir(componentsDir, { withFileTypes: true });

    const processPromises = files.map(async (file) => {
      const componentPath = path.join(componentsDir, file.name);

      if (!file.isFile() || !(componentPath.endsWith('.js') || componentPath.endsWith('.cjs'))) {
        return; // Skip non-file or non-js/cjs files
      }

      const { hasClientDirective } = await analyzeFile(componentPath);

      if (!hasClientDirective) {
        return; // Skip if no "use client"
      }

      await analyzeComponent(componentPath);
    });

    await Promise.all(processPromises); // Process all files concurrently
  } catch (error) {
    // eslint-disable-next-line no-console -- We want to log the error
    console.error('Error processing components:', error);
  }
}

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ['src/**/*.ts*'],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  sourcemap: true,
  onSuccess: updateClientDirectivesInComponents,
  shims: true,
  silent: true,
  splitting: true,
  ...options,
}));
