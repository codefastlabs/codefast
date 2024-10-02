import { relative } from 'node:path';
import type { Options } from 'tsup';

const trackedImports = new Set<string>();

// Constants
const USE_CLIENT_DIRECTIVE = '"use client"';
// Regex to check for React hooks in the code while ignoring commented-out code.
const HOOK_REGEX = /(?<!\/\/.*)(?<!\/\*.*)\buse[A-Z]\w*\s*\(.*\)/;

/**
 * Checks if the provided content includes any of the given client libraries or if it contains any React hooks.
 *
 * @param content - The string content to be checked for client libraries or hooks.
 * @param clientLibs - An array of client library names to check against the content.
 * @returns `true` if the content includes any of the client libraries or if it contains any hooks, otherwise `false`.
 */
function containsClientLibsOrHooks(content: string, clientLibs: RegExp): boolean {
  return clientLibs.test(content) || HOOK_REGEX.test(content);
}

/**
 * Builds a regex to match any of the given client libraries.
 *
 * @param clientLibs - An array of strings representing client libraries.
 * @returns A regex pattern matching any of the provided client libraries.
 */
function buildClientLibsRegex(clientLibs: string[]): RegExp {
  // Escape special characters in the library names
  const escapedLibs = clientLibs.map((lib) => lib.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));

  // Create a regex to match any of the libraries as whole words
  return new RegExp(`(?:${escapedLibs.join('|')})`, 'g');
}

/**
 * Adds a "use client" directive to the given code based on the specified client libraries.
 *
 * @param clientLibs - An array of strings representing the client libraries that should trigger the addition of "use
 *   client" directives.
 * @returns A plugin object that contains a `renderChunk` method to process and potentially modify the code chunks.
 */
export function addUseClientDirective(clientLibs: string[]): NonNullable<Options['plugins']>[number] {
  const clientLibsRegex = buildClientLibsRegex(clientLibs);

  return {
    name: 'add-use-client-directive',
    renderChunk: (code, { imports, path, map }) => {
      const relativePath = relative(process.cwd(), path);

      // If the code already contains "use client", track its imports.
      if (code.startsWith(USE_CLIENT_DIRECTIVE)) {
        imports?.forEach(({ path: importPath }) => trackedImports.add(importPath));

        return { code, map };
      }

      // If the current path is not tracked, return the original code.
      if (!trackedImports.has(relativePath)) {
        return { code, map };
      }

      // Remove the path after processing and check for client libraries/hooks.
      trackedImports.delete(relativePath);

      // Check for client libraries or React hooks in the current code and add "use client" if necessary.
      if (containsClientLibsOrHooks(code, clientLibsRegex)) {
        return {
          code: `${USE_CLIENT_DIRECTIVE};${code}`,
          map,
        };
      }

      // Return the original code if no modifications were made.
      return { code, map };
    },
  };
}
