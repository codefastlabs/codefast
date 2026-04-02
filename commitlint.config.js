/**
 * Commitlint Configuration
 *
 * Enforces conventional commit message standards across the project.
 * Ensures a consistent, readable commit history following GitHub best practices.
 */

const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
  },
};

export default config;
