import { defineConfig } from 'vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import tsConfigPaths from 'vite-tsconfig-paths';
import tailwindcss from '@tailwindcss/vite';
import { nitro } from 'nitro/vite';
import contentCollections from '@content-collections/vite';

/**
 * Vite configuration for TanStack Start application.
 *
 * @see [Vite Configuration](https://vite.dev/config/)
 * @see [TanStack Start Documentation](https://tanstack.com/start/latest)
 */
const config = defineConfig({
  /**
   * Development server options.
   * @see [Server Options](https://vite.dev/config/server-options.html)
   */
  server: {
    /** Automatically open the app in browser on server start. */
    open: true,
    /** Port for the development server. */
    port: 3000,
  },

  /**
   * Preview server options (used by `vite preview` command).
   * @see [Preview Options](https://vite.dev/config/preview-options.html)
   */
  preview: {
    /** Port for the preview server. */
    port: 3000,
  },

  /**
   * SSR (Server-Side Rendering) options.
   * @see [SSR Options](https://vite.dev/config/ssr-options.html)
   */
  ssr: {
    /**
     * Force these dependencies to be bundled into the SSR build
     * instead of being externalized.
     *
     * Required because these packages have CJS/ESM compatibility issues
     * that cause module resolution errors when left as external dependencies.
     *
     * @see [ssr.noExternal](https://vite.dev/config/ssr-options.html#ssr-noexternal)
     */
    noExternal: ['@tabler/icons-react', 'recharts', 'decimal.js-light'],
  },

  /**
   * Vite plugins configuration.
   * Order can matter for some plugins.
   */
  plugins: [
    /**
     * TanStack DevTools for debugging queries, router, and forms.
     *
     * @see [TanStack DevTools](https://tanstack.com/devtools/latest)
     */
    devtools({
      /**
       * Custom editor configuration for opening files from DevTools.
       * Configured to open files in WebStorm at the specified line and column.
       */
      editor: {
        name: 'WebStorm',
        /**
         * Opens a file in WebStorm at the specified location.
         *
         * @param path - Absolute path to the file
         * @param lineNumber - Line number to navigate to (defaults to 1)
         * @param columnNumber - Column number to navigate to (defaults to 1)
         */
        open: async (path, lineNumber = '1', columnNumber = '1') => {
          const { exec } = await import('node:child_process');

          exec(`webstorm --line ${lineNumber} --column ${columnNumber} "${path.replaceAll('$', '\\$')}"`);
        },
      },
    }),

    /** Resolves TypeScript path aliases from tsconfig.json. */
    tsConfigPaths(),

    /** Tailwind CSS v4 integration. */
    tailwindcss(),

    /** Content Collections plugin for Markdown/MDX. */
    contentCollections(),

    /** TanStack Start framework plugin for file-based routing and SSR. */
    tanstackStart(),

    /** Nitro server engine for production deployment. */
    nitro(),

    /**
     * React plugin with Babel configuration.
     * Includes React Compiler for automatic memoization.
     */
    viteReact({
      babel: {
        plugins: ['babel-plugin-react-compiler'],
      },
    }),
  ],
});

export default config;
