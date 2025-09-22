const ERROR_LEVEL = 2;
const MAX_HEADER_LENGTH = 250;
const MAX_BODY_LINE_LENGTH = 1000;

/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      ERROR_LEVEL,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
      ],
    ],
    "subject-case": [ERROR_LEVEL, "never", ["pascal-case", "upper-case"]],
    "header-max-length": [ERROR_LEVEL, "always", MAX_HEADER_LENGTH],
    "body-max-line-length": [ERROR_LEVEL, "always", MAX_BODY_LINE_LENGTH],
  },
};

export default config;
