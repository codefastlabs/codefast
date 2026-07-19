/**
 * Anti-corruption layer: maps the oxc-parser ESTree AST to the arrange domain AST.
 * This is the only place that parses TypeScript source for arrange AST translation.
 */

import { parseSync } from "oxc-parser";

import { DomainBinaryOperator, DomainSyntaxKind } from "#/arrange/domain/ast/ast-node";
import type {
  DomainArrayLiteralExpression,
  DomainAsExpression,
  DomainAstNode,
  DomainBinaryExpression,
  DomainCallExpression,
  DomainConditionalExpression,
  DomainExpressionStatement,
  DomainIdentifier,
  DomainImportClause,
  DomainImportDeclaration,
  DomainImportSpecifier,
  DomainJsxAttribute,
  DomainJsxExpression,
  DomainNamedImports,
  DomainNamespaceImport,
  DomainNoSubstitutionTemplateLiteral,
  DomainNonNullExpression,
  DomainObjectLiteralExpression,
  DomainParenthesizedExpression,
  DomainPropertyAccessExpression,
  DomainPropertyAssignment,
  DomainSatisfiesExpression,
  DomainSourceFile,
  DomainSpreadElement,
  DomainStringLiteral,
  DomainUnknownAstNode,
} from "#/arrange/domain/ast/ast-node";

/**
 * Minimal structural view over an oxc ESTree node: every node carries a `type`
 * discriminant plus `start`/`end` char offsets (UTF-16, matching source string slicing).
 */
interface OxcNode {
  readonly type: string;
  readonly start: number;
  readonly end: number;
  readonly [key: string]: unknown;
}

interface OxcProgram {
  readonly body: ReadonlyArray<OxcNode>;
}

/**
 * Mutable build view for wiring `parent` links; results satisfy readonly domain types.
 */
type WritableDomainAst<T extends DomainAstNode> = {
  -readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U> ? Array<U> : T[K];
};

function isOxcNode(value: unknown): value is OxcNode {
  return typeof value === "object" && value !== null && typeof (value as { type?: unknown }).type === "string";
}

function nodeName(node: OxcNode): string {
  return typeof node.name === "string" ? node.name : "";
}

/**
 * @since 0.3.16-canary.0
 */
export class TypeScriptAstTranslator {
  translateSourceFile(filePath: string, sourceText: string): DomainSourceFile {
    return this.parseDomainSourceFile(filePath, sourceText);
  }

  /**
   * Own child nodes in source-declaration order, mirroring `ts.forEachChild`:
   * recurses into nested node objects and arrays of nodes, skipping primitives
   * and plain records (e.g. a template element's `value`) that carry no `type`.
   */
  private *childNodesOf(node: OxcNode): Generator<OxcNode> {
    for (const key in node) {
      if (key === "type" || key === "start" || key === "end" || key === "range") {
        continue;
      }
      const value = node[key];
      if (Array.isArray(value)) {
        for (const element of value) {
          if (isOxcNode(element)) {
            yield element;
          }
        }
        continue;
      }
      if (isOxcNode(value)) {
        yield value;
      }
    }
  }

  private translateUnknown(node: OxcNode, parent: DomainAstNode | null): DomainUnknownAstNode {
    const self: WritableDomainAst<DomainUnknownAstNode> = {
      kind: DomainSyntaxKind.Unknown,
      pos: node.start,
      end: node.end,
      parent,
      children: [],
    };
    const childList: Array<DomainAstNode> = [];
    for (const child of this.childNodesOf(node)) {
      childList.push(this.translateNode(child, self as DomainUnknownAstNode));
    }
    return { ...self, children: childList } as DomainUnknownAstNode;
  }

  private stringLiteralText(node: OxcNode): string | undefined {
    if (node.type === "Literal" && typeof node.value === "string") {
      return node.value;
    }
    return undefined;
  }

  private noSubstitutionTemplateText(node: OxcNode): string | undefined {
    if (node.type !== "TemplateLiteral") {
      return undefined;
    }
    const expressions = node.expressions;
    const quasis = node.quasis;
    if (!Array.isArray(expressions) || expressions.length > 0 || !Array.isArray(quasis) || quasis.length !== 1) {
      return undefined;
    }
    const quasi = quasis[0] as { value?: { cooked?: unknown; raw?: unknown } };
    const cooked = quasi.value?.cooked;
    if (typeof cooked === "string") {
      return cooked;
    }
    return typeof quasi.value?.raw === "string" ? quasi.value.raw : "";
  }

  private mapBinaryOperator(operator: unknown): DomainBinaryOperator {
    return operator === "+" ? DomainBinaryOperator.Plus : DomainBinaryOperator.Other;
  }

  private translateImportDeclaration(node: OxcNode, parent: DomainAstNode | null): DomainImportDeclaration {
    const specifiers = Array.isArray(node.specifiers) ? (node.specifiers as ReadonlyArray<OxcNode>) : [];
    const self: WritableDomainAst<DomainImportDeclaration> = {
      kind: DomainSyntaxKind.ImportDeclaration,
      pos: node.start,
      end: node.end,
      parent,
      importClause: undefined,
      moduleSpecifier: undefined as unknown as DomainAstNode,
    };

    if (specifiers.length > 0) {
      self.importClause = this.buildImportClause(node, specifiers, self as DomainImportDeclaration);
    }

    const source = isOxcNode(node.source) ? node.source : undefined;
    self.moduleSpecifier = source
      ? this.translateNode(source, self as DomainImportDeclaration)
      : this.translateUnknown(node, self as DomainImportDeclaration);
    return self as DomainImportDeclaration;
  }

  private buildImportClause(
    declaration: OxcNode,
    specifiers: ReadonlyArray<OxcNode>,
    parent: DomainImportDeclaration,
  ): DomainImportClause {
    const defaultSpecifier = specifiers.find((specifier) => specifier.type === "ImportDefaultSpecifier");
    const namespaceSpecifier = specifiers.find((specifier) => specifier.type === "ImportNamespaceSpecifier");
    const namedSpecifiers = specifiers.filter((specifier) => specifier.type === "ImportSpecifier");

    const first = specifiers[0];
    const last = specifiers.at(-1);
    const self: WritableDomainAst<DomainImportClause> = {
      kind: DomainSyntaxKind.ImportClause,
      pos: first ? first.start : declaration.start,
      end: last ? last.end : declaration.end,
      parent,
      isTypeOnly: declaration.importKind === "type",
      name: undefined,
      namedBindings: undefined,
    };

    if (defaultSpecifier && isOxcNode(defaultSpecifier.local)) {
      self.name = this.translateIdentifier(defaultSpecifier.local, self as DomainImportClause);
    }

    if (namespaceSpecifier && isOxcNode(namespaceSpecifier.local)) {
      self.namedBindings = this.buildNamespaceImport(namespaceSpecifier, self as DomainImportClause);
    } else if (namedSpecifiers.length > 0) {
      self.namedBindings = this.buildNamedImports(namedSpecifiers, self as DomainImportClause);
    }

    return self as DomainImportClause;
  }

  private buildNamespaceImport(specifier: OxcNode, parent: DomainImportClause): DomainNamespaceImport {
    const local = specifier.local as OxcNode;
    const self: WritableDomainAst<DomainNamespaceImport> = {
      kind: DomainSyntaxKind.NamespaceImport,
      pos: specifier.start,
      end: specifier.end,
      parent,
      name: undefined as unknown as DomainIdentifier,
    };
    self.name = this.translateIdentifier(local, self as DomainNamespaceImport);
    return self as DomainNamespaceImport;
  }

  private buildNamedImports(specifiers: ReadonlyArray<OxcNode>, parent: DomainImportClause): DomainNamedImports {
    const first = specifiers[0];
    const last = specifiers.at(-1);
    const self: WritableDomainAst<DomainNamedImports> = {
      kind: DomainSyntaxKind.NamedImports,
      pos: first ? first.start : parent.pos,
      end: last ? last.end : parent.end,
      parent,
      elements: [],
    };
    const elements = specifiers.map((specifier) => this.buildImportSpecifier(specifier, self as DomainNamedImports));
    return { ...self, elements } as DomainNamedImports;
  }

  private buildImportSpecifier(specifier: OxcNode, parent: DomainNamedImports): DomainImportSpecifier {
    const local = specifier.local as OxcNode;
    const imported = isOxcNode(specifier.imported) ? specifier.imported : undefined;
    const self: WritableDomainAst<DomainImportSpecifier> = {
      kind: DomainSyntaxKind.ImportSpecifier,
      pos: specifier.start,
      end: specifier.end,
      parent,
      propertyName: undefined,
      name: undefined as unknown as DomainIdentifier,
    };
    if (imported && imported.type === "Identifier" && nodeName(imported) !== nodeName(local)) {
      self.propertyName = this.translateIdentifier(imported, self as DomainImportSpecifier);
    }
    self.name = this.translateIdentifier(local, self as DomainImportSpecifier);
    return self as DomainImportSpecifier;
  }

  private translateIdentifier(node: OxcNode, parent: DomainAstNode | null): DomainIdentifier {
    return {
      kind: DomainSyntaxKind.Identifier,
      pos: node.start,
      end: node.end,
      parent,
      text: nodeName(node),
    } satisfies DomainIdentifier;
  }

  private translateNode(node: OxcNode, parent: DomainAstNode | null): DomainAstNode {
    const pos = node.start;
    const end = node.end;

    switch (node.type) {
      case "Identifier":
      case "JSXIdentifier": {
        return this.translateIdentifier(node, parent);
      }
      case "Literal": {
        const text = this.stringLiteralText(node);
        if (text === undefined) {
          return this.translateUnknown(node, parent);
        }
        return {
          kind: DomainSyntaxKind.StringLiteral,
          pos,
          end,
          parent,
          text,
        } satisfies DomainStringLiteral;
      }
      case "TemplateLiteral": {
        const text = this.noSubstitutionTemplateText(node);
        if (text === undefined) {
          return this.translateUnknown(node, parent);
        }
        return {
          kind: DomainSyntaxKind.NoSubstitutionTemplateLiteral,
          pos,
          end,
          parent,
          text,
        } satisfies DomainNoSubstitutionTemplateLiteral;
      }
      case "ImportDeclaration": {
        return this.translateImportDeclaration(node, parent);
      }
      case "CallExpression": {
        const callee = node.callee as OxcNode;
        const args = Array.isArray(node.arguments) ? (node.arguments as ReadonlyArray<OxcNode>) : [];
        const self: WritableDomainAst<DomainCallExpression> = {
          kind: DomainSyntaxKind.CallExpression,
          pos,
          end,
          parent,
          expression: undefined as unknown as DomainAstNode,
          arguments: [],
        };
        self.expression = this.translateNode(callee, self as DomainCallExpression);
        self.arguments = args.map((arg) => this.translateNode(arg, self as DomainCallExpression));
        return self as DomainCallExpression;
      }
      case "MemberExpression": {
        if (node.computed === true) {
          return this.translateUnknown(node, parent);
        }
        const object = node.object as OxcNode;
        const property = node.property as OxcNode;
        const self: WritableDomainAst<DomainPropertyAccessExpression> = {
          kind: DomainSyntaxKind.PropertyAccessExpression,
          pos,
          end,
          parent,
          expression: undefined as unknown as DomainAstNode,
          name: undefined as unknown as DomainIdentifier,
        };
        self.expression = this.translateNode(object, self as DomainPropertyAccessExpression);
        self.name = this.translateNode(property, self as DomainPropertyAccessExpression) as DomainIdentifier;
        return self as DomainPropertyAccessExpression;
      }
      case "ObjectExpression": {
        const properties = Array.isArray(node.properties) ? (node.properties as ReadonlyArray<OxcNode>) : [];
        const self: WritableDomainAst<DomainObjectLiteralExpression> = {
          kind: DomainSyntaxKind.ObjectLiteralExpression,
          pos,
          end,
          parent,
          properties: [],
        };
        const mapped = properties.map((prop) =>
          // Object spread is `SpreadAssignment` in TS (an unknown node), not the array
          // `SpreadElement` — route it through the generic walker to mirror that shape.
          prop.type === "SpreadElement"
            ? this.translateUnknown(prop, self as DomainObjectLiteralExpression)
            : this.translateNode(prop, self as DomainObjectLiteralExpression),
        );
        return { ...self, properties: mapped } as DomainObjectLiteralExpression;
      }
      case "Property": {
        if (node.shorthand === true || node.method === true || node.kind !== "init") {
          return this.translateUnknown(node, parent);
        }
        const key = node.key as OxcNode;
        const value = node.value as OxcNode;
        const self: WritableDomainAst<DomainPropertyAssignment> = {
          kind: DomainSyntaxKind.PropertyAssignment,
          pos,
          end,
          parent,
          name: undefined as unknown as DomainAstNode,
          initializer: undefined as unknown as DomainAstNode,
        };
        self.name = this.translateNode(key, self as DomainPropertyAssignment);
        self.initializer = this.translateNode(value, self as DomainPropertyAssignment);
        return self as DomainPropertyAssignment;
      }
      case "ArrayExpression": {
        const elements = Array.isArray(node.elements) ? (node.elements as ReadonlyArray<OxcNode | null>) : [];
        const self: WritableDomainAst<DomainArrayLiteralExpression> = {
          kind: DomainSyntaxKind.ArrayLiteralExpression,
          pos,
          end,
          parent,
          elements: [],
        };
        const mapped: Array<DomainAstNode> = [];
        for (const element of elements) {
          if (element === null) {
            continue;
          }
          mapped.push(this.translateNode(element, self as DomainArrayLiteralExpression));
        }
        return { ...self, elements: mapped } as DomainArrayLiteralExpression;
      }
      case "SpreadElement": {
        const argument = node.argument as OxcNode;
        const self: WritableDomainAst<DomainSpreadElement> = {
          kind: DomainSyntaxKind.SpreadElement,
          pos,
          end,
          parent,
          expression: undefined as unknown as DomainAstNode,
        };
        self.expression = this.translateNode(argument, self as DomainSpreadElement);
        return self as DomainSpreadElement;
      }
      case "ParenthesizedExpression": {
        const expression = node.expression as OxcNode;
        const self: WritableDomainAst<DomainParenthesizedExpression> = {
          kind: DomainSyntaxKind.ParenthesizedExpression,
          pos,
          end,
          parent,
          expression: undefined as unknown as DomainAstNode,
        };
        self.expression = this.translateNode(expression, self as DomainParenthesizedExpression);
        return self as DomainParenthesizedExpression;
      }
      case "TSAsExpression": {
        const expression = node.expression as OxcNode;
        const self: WritableDomainAst<DomainAsExpression> = {
          kind: DomainSyntaxKind.AsExpression,
          pos,
          end,
          parent,
          expression: undefined as unknown as DomainAstNode,
        };
        self.expression = this.translateNode(expression, self as DomainAsExpression);
        return self as DomainAsExpression;
      }
      case "TSSatisfiesExpression": {
        const expression = node.expression as OxcNode;
        const self: WritableDomainAst<DomainSatisfiesExpression> = {
          kind: DomainSyntaxKind.SatisfiesExpression,
          pos,
          end,
          parent,
          expression: undefined as unknown as DomainAstNode,
        };
        self.expression = this.translateNode(expression, self as DomainSatisfiesExpression);
        return self as DomainSatisfiesExpression;
      }
      case "TSNonNullExpression": {
        const expression = node.expression as OxcNode;
        const self: WritableDomainAst<DomainNonNullExpression> = {
          kind: DomainSyntaxKind.NonNullExpression,
          pos,
          end,
          parent,
          expression: undefined as unknown as DomainAstNode,
        };
        self.expression = this.translateNode(expression, self as DomainNonNullExpression);
        return self as DomainNonNullExpression;
      }
      case "ConditionalExpression": {
        const test = node.test as OxcNode;
        const consequent = node.consequent as OxcNode;
        const alternate = node.alternate as OxcNode;
        const self: WritableDomainAst<DomainConditionalExpression> = {
          kind: DomainSyntaxKind.ConditionalExpression,
          pos,
          end,
          parent,
          condition: undefined as unknown as DomainAstNode,
          whenTrue: undefined as unknown as DomainAstNode,
          whenFalse: undefined as unknown as DomainAstNode,
        };
        self.condition = this.translateNode(test, self as DomainConditionalExpression);
        self.whenTrue = this.translateNode(consequent, self as DomainConditionalExpression);
        self.whenFalse = this.translateNode(alternate, self as DomainConditionalExpression);
        return self as DomainConditionalExpression;
      }
      case "BinaryExpression": {
        const left = node.left as OxcNode;
        const right = node.right as OxcNode;
        const self: WritableDomainAst<DomainBinaryExpression> = {
          kind: DomainSyntaxKind.BinaryExpression,
          pos,
          end,
          parent,
          left: undefined as unknown as DomainAstNode,
          operator: this.mapBinaryOperator(node.operator),
          right: undefined as unknown as DomainAstNode,
        };
        self.left = this.translateNode(left, self as DomainBinaryExpression);
        self.right = this.translateNode(right, self as DomainBinaryExpression);
        return self as DomainBinaryExpression;
      }
      case "ExpressionStatement": {
        const expression = node.expression as OxcNode;
        const self: WritableDomainAst<DomainExpressionStatement> = {
          kind: DomainSyntaxKind.ExpressionStatement,
          pos,
          end,
          parent,
          expression: undefined as unknown as DomainAstNode,
        };
        self.expression = this.translateNode(expression, self as DomainExpressionStatement);
        return self as DomainExpressionStatement;
      }
      case "JSXAttribute": {
        const name = node.name as OxcNode;
        const value = isOxcNode(node.value) ? node.value : undefined;
        const self: WritableDomainAst<DomainJsxAttribute> = {
          kind: DomainSyntaxKind.JsxAttribute,
          pos,
          end,
          parent,
          name: undefined as unknown as DomainAstNode,
          initializer: undefined,
        };
        self.name = this.translateNode(name, self as DomainJsxAttribute);
        if (value) {
          self.initializer = this.translateNode(value, self as DomainJsxAttribute);
        }
        return self as DomainJsxAttribute;
      }
      case "JSXExpressionContainer": {
        const expression = isOxcNode(node.expression) ? node.expression : undefined;
        const self: WritableDomainAst<DomainJsxExpression> = {
          kind: DomainSyntaxKind.JsxExpression,
          pos,
          end,
          parent,
          expression: undefined,
        };
        if (expression && expression.type !== "JSXEmptyExpression") {
          self.expression = this.translateNode(expression, self as DomainJsxExpression);
        }
        return self as DomainJsxExpression;
      }
      default:
        return this.translateUnknown(node, parent);
    }
  }

  private parseDomainSourceFile(filePath: string, sourceText: string): DomainSourceFile {
    // Best-effort parse to mirror `ts.createSourceFile` leniency — recoverable syntax
    // errors still yield a usable tree, so `parseSync` errors are intentionally ignored.
    const program = parseSync(filePath, sourceText).program as unknown as OxcProgram;
    const statements = program.body.map((statement) => this.translateNode(statement, null));
    return {
      fileName: filePath,
      text: sourceText,
      statements,
    } satisfies DomainSourceFile;
  }
}
