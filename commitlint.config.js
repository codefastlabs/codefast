const ERROR_LEVEL = 2;
const MAX_HEADER_LENGTH = 250;
const MAX_BODY_LINE_LENGTH = 1000;

/** @type {import("@commitlint/types").UserConfig} */
const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [ERROR_LEVEL, "always", MAX_BODY_LINE_LENGTH],
    "header-max-length": [ERROR_LEVEL, "always", MAX_HEADER_LENGTH],
    "subject-case": [ERROR_LEVEL, "never", ["pascal-case", "upper-case"]],
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
  },
};

export default config;
