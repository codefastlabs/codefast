import { parseSync } from "oxc-parser";

import type { ReactImportViolation } from "#/audit/domain/types";

interface OxcNode {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly [key: string]: unknown;
}

function isOxcNode(value: unknown): value is OxcNode {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

function isIdentifierNamed(node: unknown, name: string): boolean {
  return isOxcNode(node) && node.type === "Identifier" && node.name === name;
}

/**
 * Scans one TypeScript source for React import-policy violations.
 *
 * @remarks Three violation kinds: `import * as React`, a default `React` import (type-only
 * included), and — only when no import binds `React` — an implicit `React.*` UMD-global type
 * reference, which tsc accepts silently through the `export as namespace React` in `@types/react`.
 */
export function auditReactImportSource(filePath: string, sourceText: string): Array<ReactImportViolation> {
  const { program } = parseSync(filePath, sourceText);
  const statements = (program as unknown as { body: ReadonlyArray<OxcNode> }).body;
  const violations: Array<ReactImportViolation> = [];
  let bindsReact = false;

  for (const statement of statements) {
    if (statement.type !== "ImportDeclaration") {
      continue;
    }
    const source = statement.source;
    if (!isOxcNode(source) || source.value !== "react") {
      continue;
    }
    const specifiers = Array.isArray(statement.specifiers) ? statement.specifiers.filter(isOxcNode) : [];
    bindsReact ||= specifiers.some((specifier) => isIdentifierNamed(specifier.local, "React"));
    for (const specifier of specifiers) {
      if (specifier.type === "ImportNamespaceSpecifier") {
        violations.push({
          line: lineOfOffset(sourceText, statement.start),
          raw: firstLineOf(sourceText.slice(statement.start, statement.end)),
          reason: 'namespace React import — import members by name from "react"',
        });
      } else if (specifier.type === "ImportDefaultSpecifier") {
        violations.push({
          line: lineOfOffset(sourceText, statement.start),
          raw: firstLineOf(sourceText.slice(statement.start, statement.end)),
          reason: 'default React import — import members by name from "react"',
        });
      }
    }
  }

  // A bound `React` means the import itself is flagged above; qualified names under it are
  // symptoms, not extra findings.
  if (!bindsReact) {
    collectUmdGlobalReferences(program as unknown as OxcNode, sourceText, violations);
  }

  violations.sort((a, b) => a.line - b.line);
  return violations;
}

function collectUmdGlobalReferences(node: OxcNode, sourceText: string, violations: Array<ReactImportViolation>): void {
  if (node.type === "TSQualifiedName" && isIdentifierNamed(node.left, "React")) {
    violations.push({
      line: lineOfOffset(sourceText, node.start),
      raw: sourceText.slice(node.start, node.end),
      reason: 'implicit React.* UMD global — add import type { … } from "react"',
    });
    return;
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isOxcNode(item)) {
          collectUmdGlobalReferences(item, sourceText, violations);
        }
      }
    } else if (isOxcNode(value)) {
      collectUmdGlobalReferences(value, sourceText, violations);
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
