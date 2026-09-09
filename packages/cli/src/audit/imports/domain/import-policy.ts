import { parseSync } from "oxc-parser";

import type { ImportPolicyViolation } from "#/audit/domain/types";

interface OxcNode {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly [key: string]: unknown;
}

/**
 * One library's import policy: which forms of importing `module` are banned, optionally limited to
 * files whose repo-relative path matches `scope`, plus an optional UMD-global name to flag when the
 * file references `<name>.*` without importing it.
 *
 * @since 0.10.0
 */
export interface ImportPolicyRule {
  readonly module: string;
  /** Banned forms: `namespace` (`import * as x`), `default` (`import x`), or `named:<name>`. */
  readonly ban: ReadonlyArray<"namespace" | "default" | `named:${string}`>;
  readonly scope?: ReadonlyArray<string> | undefined;
  readonly umdGlobal?: string | undefined;
  readonly message: string;
}

/**
 * The import policies enforced across the monorepo: React members by name (never a namespace,
 * default, or implicit `React.*` UMD global), and Zod as a namespace repo-wide — the house form,
 * so a named `import { z }` never pins Zod's full locale set into a package that ships bundled.
 *
 * @since 0.10.0
 */
export const defaultImportPolicyRules: ReadonlyArray<ImportPolicyRule> = [
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

function isOxcNode(value: unknown): value is OxcNode {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

function isIdentifierNamed(node: unknown, name: string): boolean {
  return isOxcNode(node) && node.type === "Identifier" && node.name === name;
}

function importedName(specifier: OxcNode): string | undefined {
  const imported = specifier.imported;
  return isOxcNode(imported) && typeof imported.name === "string" ? imported.name : undefined;
}

/**
 * Scans one TypeScript source against the given import-policy rules and returns the violations.
 *
 * @remarks Each rule matches import declarations from its `module` and flags the banned forms;
 * a rule with `umdGlobal` additionally flags implicit `<name>.*` type references when nothing in
 * the file imports that name (the case tsc accepts silently through a UMD `export as namespace`).
 *
 * @since 0.10.0
 */
export function auditImportPolicySource(
  filePath: string,
  sourceText: string,
  rules: ReadonlyArray<ImportPolicyRule>,
): Array<ImportPolicyViolation> {
  const { program } = parseSync(filePath, sourceText);
  const statements = (program as unknown as { body: ReadonlyArray<OxcNode> }).body;
  const violations: Array<ImportPolicyViolation> = [];
  const boundUmdNames = new Set<string>();

  for (const rule of rules) {
    const bannedNamed = new Set<string>();
    let banNamespace = false;
    let banDefault = false;
    for (const form of rule.ban) {
      if (form === "namespace") {
        banNamespace = true;
      } else if (form === "default") {
        banDefault = true;
      } else {
        bannedNamed.add(form.slice("named:".length));
      }
    }

    for (const statement of statements) {
      if (statement.type !== "ImportDeclaration") {
        continue;
      }
      const source = statement.source;
      if (!isOxcNode(source) || source.value !== rule.module) {
        continue;
      }
      const specifiers = Array.isArray(statement.specifiers) ? statement.specifiers.filter(isOxcNode) : [];
      const umdGlobal = rule.umdGlobal;
      if (umdGlobal !== undefined && specifiers.some((specifier) => isIdentifierNamed(specifier.local, umdGlobal))) {
        boundUmdNames.add(umdGlobal);
      }
      for (const specifier of specifiers) {
        if (banNamespace && specifier.type === "ImportNamespaceSpecifier") {
          violations.push(violationAt(sourceText, statement, `namespace import of "${rule.module}" — ${rule.message}`));
        } else if (banDefault && specifier.type === "ImportDefaultSpecifier") {
          violations.push(violationAt(sourceText, statement, `default import of "${rule.module}" — ${rule.message}`));
        } else if (specifier.type === "ImportSpecifier") {
          const name = importedName(specifier);
          if (name !== undefined && bannedNamed.has(name)) {
            violations.push(
              violationAt(sourceText, statement, `named import { ${name} } from "${rule.module}" — ${rule.message}`),
            );
          }
        }
      }
    }
  }

  for (const rule of rules) {
    if (rule.umdGlobal !== undefined && !boundUmdNames.has(rule.umdGlobal)) {
      collectUmdGlobalReferences(program as unknown as OxcNode, sourceText, rule, violations);
    }
  }

  violations.sort((a, b) => a.line - b.line);
  return violations;
}

function violationAt(sourceText: string, statement: OxcNode, reason: string): ImportPolicyViolation {
  return {
    line: lineOfOffset(sourceText, statement.start),
    raw: firstLineOf(sourceText.slice(statement.start, statement.end)),
    reason,
  };
}

function collectUmdGlobalReferences(
  node: OxcNode,
  sourceText: string,
  rule: ImportPolicyRule,
  violations: Array<ImportPolicyViolation>,
): void {
  if (node.type === "TSQualifiedName" && isIdentifierNamed(node.left, rule.umdGlobal ?? "")) {
    violations.push({
      line: lineOfOffset(sourceText, node.start),
      raw: sourceText.slice(node.start, node.end),
      reason: `implicit ${rule.umdGlobal}.* UMD global — ${rule.message}`,
    });
    return;
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isOxcNode(item)) {
          collectUmdGlobalReferences(item, sourceText, rule, violations);
        }
      }
    } else if (isOxcNode(value)) {
      collectUmdGlobalReferences(value, sourceText, rule, violations);
    }
  }
}

function lineOfOffset(sourceText: string, offset: number): number {
  let line = 1;
  for (let index = 0; index < offset; index++) {
    if (sourceText.charCodeAt(index) === 10) {
      line++;
    }
  }
  return line;
}

function firstLineOf(text: string): string {
  const newlineIndex = text.indexOf("\n");
  return newlineIndex === -1 ? text : text.slice(0, newlineIndex);
}
