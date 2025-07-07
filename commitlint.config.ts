import type { UserConfig } from "@commitlint/types";

const ERROR_LEVEL = 2;
const MAX_SUBJECT_LENGTH = 100;
const MAX_BODY_LINE_LENGTH = 500;

const config: UserConfig = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      ERROR_LEVEL,
      "always",
      ["build", "chore", "ci", "docs", "feat", "fix", "perf", "refactor", "revert", "style", "test"],
    ],
    "subject-case": [ERROR_LEVEL, "never", ["pascal-case", "upper-case"]],
    "subject-max-length": [ERROR_LEVEL, "always", MAX_SUBJECT_LENGTH],
    "body-max-line-length": [ERROR_LEVEL, "always", MAX_BODY_LINE_LENGTH],
  },
};

export default config;
