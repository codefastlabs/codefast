/** @type { import("eslint").Linter.Config } */
module.exports = {
  overrides: [
    {
      extends: [require.resolve('@vercel/style-guide/eslint/jest-react')],
      files: ['**/__tests__/**/*.[jt]s?(x)', '**/?(*.)+(test).[jt]s?(x)'],
    },
  ],
  plugins: ['only-warn', 'typescript-sort-keys'],
  rules: {
    /** Disables the rule that enforces using nullish coalescing operator */
    '@typescript-eslint/prefer-nullish-coalescing': 'off',

    /** Warns when non-string types are used in template expressions but allows numbers */
    '@typescript-eslint/restrict-template-expressions': [
      'warn',
      {
        allowNumber: true,
      },
    ],

    /** Disables the rule that prevents unbound methods */
    '@typescript-eslint/unbound-method': 'off',

    /** Enforces consistent use of curly braces for all control statements */
    curly: ['warn', 'all'],

    /** Disables the rule that disallows default exports */
    'import/no-default-export': 'off',

    /** Enforces a specific order for import statements */
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: true,
        },
        groups: ['builtin', 'external', 'internal', 'parent', 'sibling', 'index', 'object', 'type'],
        'newlines-between': 'always',
        pathGroups: [
          {
            pattern: '@/**',
            group: 'internal',
            position: 'before',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin'],
      },
    ],

    /** Prevents fallthrough in switch statements but allows empty cases */
    'no-fallthrough': [
      'error',
      {
        allowEmptyCase: true,
      },
    ],

    /** Enforces consistent blank lines between statements */
    'padding-line-between-statements': [
      'warn',
      {
        blankLine: 'always',
        next: 'return',
        prev: '*',
      },
      {
        blankLine: 'always',
        next: '*',
        prev: ['const', 'let', 'var'],
      },
      {
        blankLine: 'any',
        next: ['const', 'let', 'var'],
        prev: ['const', 'let', 'var'],
      },
      {
        blankLine: 'always',
        next: '*',
        prev: 'block-like',
      },
      {
        blankLine: 'always',
        next: 'block-like',
        prev: '*',
      },
      {
        blankLine: 'always',
        next: '*',
        prev: 'directive',
      },
      {
        blankLine: 'any',
        next: 'directive',
        prev: 'directive',
      },
      {
        blankLine: 'always',
        next: '*',
        prev: ['case', 'default'],
      },
    ],

    /** Warns when interface keys aren't sorted in ascending order, with required keys first */
    'typescript-sort-keys/interface': [
      'warn',
      'asc',
      {
        requiredFirst: true,
      },
    ],

    /** Warns when string enum keys aren't sorted in ascending order */
    'typescript-sort-keys/string-enum': 'warn',
  },
};
