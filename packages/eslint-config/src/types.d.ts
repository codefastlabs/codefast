declare module "@next/eslint-plugin-next" {
  import type { ESLint, Linter } from "eslint";

  interface NextESLintPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
      "core-web-vitals": Linter.Config;
    };
  }

  const plugin: NextESLintPlugin;
  export default plugin;
}

declare module "eslint-plugin-only-warn" {
  import type { ESLint } from "eslint";

  const plugin: ESLint.Plugin;
  export default plugin;
}

declare module "eslint-config-prettier" {
  import type { Linter } from "eslint";

  const config: Linter.Config;
  export default config;
}

declare module "eslint-plugin-turbo" {
  import type { ESLint, Linter } from "eslint";

  interface TurboESLintPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
    };
  }

  const plugin: TurboESLintPlugin;
  export default plugin;

  export const configs: {
    recommended: Linter.Config;
  };
}

declare module "eslint-plugin-jsx-a11y" {
  import type { ESLint, Linter } from "eslint";

  interface JsxA11yESLintPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
    };
  }

  const plugin: JsxA11yESLintPlugin;
  export default plugin;
}

declare module "eslint-plugin-perfectionist" {
  import type { ESLint, Linter } from "eslint";

  interface PerfectionistESLintPlugin extends ESLint.Plugin {
    configs: {
      recommended: Linter.Config;
    };
  }

  const plugin: PerfectionistESLintPlugin;
  export default plugin;
}
