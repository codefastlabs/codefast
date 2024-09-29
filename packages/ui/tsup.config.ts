import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'tsup';
import pLimit from 'p-limit';

const componentsDir = path.resolve(__dirname, './dist/components');
const clientLibs = [
  '@radix-ui/react-context',
  'vaul',
  'cmdk',
  'input-otp',
  'react-resizable-panels',
  '@radix-ui/primitive',
];

const limit = pLimit(10);

// Function to check for "use client" directive and client libraries/hooks in a file
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

// Function to add the "use client" directive to the beginning of a file if not already present
async function addUseClientDirective(filePath: string, content: string): Promise<void> {
  if (content.startsWith('"use client"')) {
    return; // Skip if already has "use client"
  }

  await fs.writeFile(filePath, `"use client";${content}`, 'utf-8');
}

// Function to analyze a component and its imports for chunk files
async function analyzeComponent(componentPath: string): Promise<void> {
  try {
    const { content } = await analyzeFile(componentPath);
    const importRegex = /import.*?from\s*['"](?<path>[^'"]+)['"]/g;
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

// Main function to process all components in dist/components
async function updateClientDirectivesInComponents(): Promise<void> {
  try {
    const files = await fs.readdir(componentsDir, { withFileTypes: true });

    const processPromises = files.map((file) =>
      limit(async () => {
        const componentPath = path.join(componentsDir, file.name);

        if (!file.isFile() || !(componentPath.endsWith('.js') || componentPath.endsWith('.cjs'))) {
          return; // Skip non-file or non-js/cjs files
        }

        const { hasClientDirective } = await analyzeFile(componentPath);

        if (!hasClientDirective) {
          return; // Skip if no "use client"
        }

        await analyzeComponent(componentPath);
      }),
    );

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
