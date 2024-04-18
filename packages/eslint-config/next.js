const { resolve } = require("node:path");

const project = resolve(process.cwd(), "tsconfig.json");

/** @type {import("eslint").Linter.Config} */
module.exports = {
  extends: [
    require.resolve("@vercel/style-guide/eslint/browser"),
    require.resolve("@vercel/style-guide/eslint/typescript"),
    require.resolve("@vercel/style-guide/eslint/react"),
    require.resolve("@vercel/style-guide/eslint/next"),
  ],
  globals: {
    React: true,
    JSX: true,
  },
  ignorePatterns: ["node_modules/", ".next/", ".eslintrc.js", "*.config.js"],
  overrides: [
    {
      extends: [require.resolve("@vercel/style-guide/eslint/jest")],
      files: ["**/__tests__/**/*.[jt]s?(x)", "**/?(*.)+(test).[jt]s?(x)"],
    },
  ],
  parserOptions: {
    project,
  },
  plugins: ["only-warn"],
  rules: {
    curly: ["error", "all"],
    "import/no-default-export": "off",
    "react/no-unknown-property": [
      "error",
      {
        ignore: ["vaul-drawer-wrapper"],
      },
    ],
    "@typescript-eslint/restrict-template-expressions": [
      "error",
      {
        allowNumber: true,
      },
    ],
    "@typescript-eslint/no-misused-promises": [
      "error",
      {
        checksVoidReturn: {
          attributes: false,
        },
      },
    ],
  },
  settings: {
    "import/resolver": {
      typescript: {
        project,
      },
    },
  },
};
