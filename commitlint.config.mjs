const config = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "body-max-line-length": [2, "always", 350],
    "header-max-length": [2, "always", 150],
  },
};

export default config;
