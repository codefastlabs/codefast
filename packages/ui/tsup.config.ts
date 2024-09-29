import { promises as fs } from 'node:fs';
import path from 'node:path';
import { defineConfig } from 'tsup';
import pLimit from 'p-limit';

const distDir = path.resolve(__dirname, './dist');
const limit = pLimit(5);

/**
 * Retrieves a list of directory paths from a given source directory.
 *
 * @param source - The path of the source directory.
 * @returns A promise that resolves to an array of directory paths.
 */
async function getDirectories(source: string): Promise<string[]> {
  const files = await fs.readdir(source, { withFileTypes: true });

  return files.filter((dirent) => dirent.isDirectory()).map((dirent) => path.join(source, dirent.name));
}

/**
 * Updates the index.js and index.cjs files in a given directory with export statements
 * for all JavaScript files in that directory, excluding the index files themselves.
 *
 * @param dir - The directory path where the index files and JavaScript files are located.
 * @returns A promise that resolves when the index files have been successfully written.
 */
async function updateIndexFile(dir: string): Promise<void> {
  const files = await fs.readdir(dir);

  // Filter JavaScript files that are not index.js
  const jsFiles = files.filter((file) => file.endsWith('.js') && file !== 'index.js');

  if (jsFiles.length > 0) {
    // Generate export statements for ESM and CommonJS
    const jsExports = jsFiles.map((file) => `export * from './${file.replace('.js', '')}';`).join('\n');
    const cjsExports = jsFiles.map((file) => `module.exports = require('./${file.replace('.js', '')}');`).join('\n');

    const indexEsmPath = path.join(dir, 'index.js');
    const indexCjsPath = path.join(dir, 'index.cjs');

    // Write index.js and index.cjs files with exports
    try {
      await Promise.allSettled([
        fs.writeFile(indexEsmPath, `${jsExports}\n//# sourceMappingURL=index.js.map`, 'utf8'),
        fs.writeFile(indexCjsPath, `${cjsExports}\n//# sourceMappingURL=index.cjs.map`, 'utf8'),
      ]);
    } catch (error) {
      // eslint-disable-next-line no-console -- Log error to console
      console.error(`Error updating index files in ${dir}:`, error);
    }
  }
}

/**
 * Updates export statements for JavaScript and CommonJS modules in the distribution directory.
 *
 * This method scans all subdirectories in the distribution directory, generates unified export statements
 * and writes them to the appropriate `index.js` and `index.cjs` files. Both the ESM and CommonJS files are
 * updated concurrently for efficiency.
 *
 * @returns A promise that resolves when the export updates are completed, or rejects if an error occurs during the
 *   process.
 */
export async function updateExports(): Promise<void> {
  const directories = await getDirectories(distDir);

  // Process updating index.js and index.cjs in subdirectories in parallel
  const updatePromises = directories.map((dir) => limit(() => updateIndexFile(dir)));

  const results = await Promise.allSettled(updatePromises);

  // Log any errors encountered during updates
  results.forEach((result, index) => {
    if (result.status === 'rejected') {
      // eslint-disable-next-line no-console -- Log error to console
      console.error(`Failed to update index files for directory ${directories[index]}:`, result.reason);
    }
  });

  // Create exports for dist/index.js and dist/index.cjs
  const rootEsmExports = directories.map((dir) => `export * from './${path.basename(dir)}';`).join('\n');
  const rootCjsExports = directories.map((dir) => `module.exports = require('./${path.basename(dir)}');`).join('\n');

  // Write index.js file for ESM and index.cjs file for CommonJS in the root directory
  try {
    await Promise.allSettled([
      fs.writeFile(path.join(distDir, 'index.js'), `${rootEsmExports}\n//# sourceMappingURL=index.js.map`, 'utf8'),
      fs.writeFile(path.join(distDir, 'index.cjs'), `${rootCjsExports}\n//# sourceMappingURL=index.cjs.map`, 'utf8'),
    ]);
  } catch (error) {
    // eslint-disable-next-line no-console -- Log error to console
    console.error('Error writing root index files:', error);
  }
}

export default defineConfig((options) => ({
  clean: !options.watch,
  dts: true,
  entry: ['src/**/*.ts*'],
  format: ['cjs', 'esm'],
  minify: !options.watch,
  sourcemap: true,
  onSuccess: updateExports,
  shims: true,
  silent: true,
  splitting: true,
  ...options,
}));
