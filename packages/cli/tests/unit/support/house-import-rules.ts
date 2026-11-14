import type { ImportRule } from "#core/config/schema";

/**
 * The codefast monorepo's import rules, as its config declares them, for the import-policy tests.
 */
export const houseImportRules: Array<ImportRule> = [
  {
    module: "react",
    ban: ["namespace", "default"],
    umdGlobal: "React",
    message: 'import React members by name from "react"',
  },
  {
    module: "zod",
    ban: ["named:z"],
    message:
      'import Zod as a namespace: import * as z from "zod" (repo house form; a named import { z } pins Zod\'s full ' +
      "locale set into any bundle that reaches it)",
  },
];
