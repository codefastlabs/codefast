const { resolve } = require('node:path');

const project = resolve(process.cwd(), 'tsconfig.json');

/** @type { import("eslint").Linter.Config } */
module.exports = {
  extends: [
    require.resolve('@vercel/style-guide/eslint/node'),
    require.resolve('@vercel/style-guide/eslint/typescript'),
    require.resolve('@vercel/style-guide/eslint/browser'),
    require.resolve('@vercel/style-guide/eslint/react'),
    require.resolve('@vercel/style-guide/eslint/next'),
    require.resolve('./rules/common'),
  ],
  globals: {
    React: true,
    JSX: true,
  },
  ignorePatterns: ['node_modules/', '.next/', '*.js', '*.mjs', '*.cjs'],
  overrides: [
    {
      extends: [require.resolve('@vercel/style-guide/eslint/jest')],
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
    },
  ],
  parserOptions: {
    project,
  },
  plugins: ['only-warn', 'typescript-sort-keys'],
  rules: {
    /** Warns when Promises are used inappropriately */
    '@typescript-eslint/no-misused-promises': [
      'warn',
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],

    /** Warns when JSX components aren't in PascalCase but allows namespaces */
    'react/jsx-pascal-case': [
      'warn',
      {
        allowNamespace: true,
      },
    ],

    /** Enforces sorting of JSX props */
    'react/jsx-sort-props': [
      'warn',
      {
        callbacksLast: true,
        ignoreCase: true,
        reservedFirst: true,
        shorthandFirst: true,
      },
    ],

    /** Warns when using unknown DOM properties but ignores specified custom elements */
    'react/no-unknown-property': [
      'warn',
      {
        ignore: ['vaul-drawer-wrapper'],
      },
    ],
  },
  settings: {
    'import/resolver': {
      typescript: {
        project,
      },
    },
  },
};
