/**
 * Commitlint Configuration
 *
 * Enforces conventional commit message standards across the project.
 * Ensures a consistent, readable commit history following GitHub best practices.
 */

// Configuration constants
const ERROR_LEVEL = 2;
const MAX_HEADER_LENGTH = 120;
const MAX_BODY_LINE_LENGTH = 250;

const config = {
  extends: ["@commitlint/config-conventional"],

  rules: {
    // Enforce maximum line lengths for readability
    "body-max-line-length": [ERROR_LEVEL, "always", MAX_BODY_LINE_LENGTH],
    "header-max-length": [ERROR_LEVEL, "always", MAX_HEADER_LENGTH],

    // Prevent PascalCase and UPPERCASE in commit subjects
    "subject-case": [ERROR_LEVEL, "never", ["pascal-case", "upper-case"]],

    // Define allowed commit types following conventional commits
    "type-enum": [
      ERROR_LEVEL,
      "always",
      [
        "build", // Changes to a build system or external dependencies
        "chore", // Maintenance tasks, no production code changes
        "ci", // Changes to CI configuration files and scripts
        "docs", // Documentation only changes
        "feat", // New features
        "fix", // Bug fixes
        "perf", // Performance improvements
        "refactor", // Code refactoring without feature changes
        "revert", // Reverts a previous commit
        "style", // Code style changes (formatting, etc.)
        "test", // Adding or updating tests
      ],
    ],
  },
};

export default config;
