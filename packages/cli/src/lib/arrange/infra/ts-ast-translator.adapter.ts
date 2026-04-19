/**
 * Anti-corruption layer: maps TypeScript compiler AST to arrange domain AST.
 * This module is the only place that imports `typescript` for arrange AST translation.
 */

import ts from "typescript";
import { DomainBinaryOperator, DomainSyntaxKind } from "#/lib/arrange/domain/ast/ast-node.model";
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
} from "#/lib/arrange/domain/ast/ast-node.model";

/** Mutable build view for wiring `parent` links; results satisfy readonly domain types. */
type WritableDomainAst<T extends DomainAstNode> = {
  -readonly [K in keyof T]: T[K] extends ReadonlyArray<infer U> ? U[] : T[K];
};

function translateUnknown(
  n: ts.Node,
  parent: DomainAstNode | null,
  sf: ts.SourceFile,
): DomainUnknownAstNode {
  const pos = n.getStart(sf);
  const end = n.getEnd();
  const self: WritableDomainAst<DomainUnknownAstNode> = {
    kind: DomainSyntaxKind.Unknown,
    pos,
    end,
    parent,
    children: [],
  };
  const childList: DomainAstNode[] = [];
  ts.forEachChild(n, (child) => {
    childList.push(translateNode(child, self as DomainUnknownAstNode, sf));
  });
  return { ...self, children: childList } as DomainUnknownAstNode;
}

function mapBinaryOperator(operatorToken: ts.Node): DomainBinaryOperator {
  if (operatorToken.kind === ts.SyntaxKind.PlusToken) {
    return DomainBinaryOperator.Plus;
  }
  return DomainBinaryOperator.Other;
}

export function translateNode(
  n: ts.Node,
  parent: DomainAstNode | null,
  sf: ts.SourceFile,
): DomainAstNode {
  const pos = n.getStart(sf);
  const end = n.getEnd();

  switch (n.kind) {
    case ts.SyntaxKind.Identifier: {
      const id = n as ts.Identifier;
      return {
        kind: DomainSyntaxKind.Identifier,
        pos,
        end,
        parent,
        text: id.text,
      } satisfies DomainIdentifier;
    }
    case ts.SyntaxKind.StringLiteral: {
      const lit = n as ts.StringLiteral;
      return {
        kind: DomainSyntaxKind.StringLiteral,
        pos,
        end,
        parent,
        text: lit.text,
      } satisfies DomainStringLiteral;
    }
    case ts.SyntaxKind.NoSubstitutionTemplateLiteral: {
      const lit = n as ts.NoSubstitutionTemplateLiteral;
      return {
        kind: DomainSyntaxKind.NoSubstitutionTemplateLiteral,
        pos,
        end,
        parent,
        text: lit.text,
      } satisfies DomainNoSubstitutionTemplateLiteral;
    }
    case ts.SyntaxKind.ImportDeclaration: {
      const decl = n as ts.ImportDeclaration;
      const self: WritableDomainAst<DomainImportDeclaration> = {
        kind: DomainSyntaxKind.ImportDeclaration,
        pos,
        end,
        parent,
        importClause: undefined,
        moduleSpecifier: undefined as unknown as DomainAstNode,
      };
      if (decl.importClause) {
        self.importClause = translateNode(
          decl.importClause,
          self as DomainImportDeclaration,
          sf,
        ) as DomainImportClause;
      }
      self.moduleSpecifier = translateNode(
        decl.moduleSpecifier,
        self as DomainImportDeclaration,
        sf,
      );
      return self as DomainImportDeclaration;
    }
    case ts.SyntaxKind.ImportClause: {
      const clause = n as ts.ImportClause;
      const self: WritableDomainAst<DomainImportClause> = {
        kind: DomainSyntaxKind.ImportClause,
        pos,
        end,
        parent,
        isTypeOnly: clause.isTypeOnly,
        name: undefined,
        namedBindings: undefined,
      };
      if (clause.name) {
        self.name = translateNode(clause.name, self as DomainImportClause, sf) as DomainIdentifier;
      }
      if (clause.namedBindings) {
        self.namedBindings = translateNode(clause.namedBindings, self as DomainImportClause, sf) as
          | DomainNamedImports
          | DomainNamespaceImport;
      }
      return self as DomainImportClause;
    }
    case ts.SyntaxKind.NamedImports: {
      const named = n as ts.NamedImports;
      const self: WritableDomainAst<DomainNamedImports> = {
        kind: DomainSyntaxKind.NamedImports,
        pos,
        end,
        parent,
        elements: [],
      };
      const elements: DomainImportSpecifier[] = [];
      for (const element of named.elements) {
        elements.push(
          translateNode(element, self as DomainNamedImports, sf) as DomainImportSpecifier,
        );
      }
      return { ...self, elements } as DomainNamedImports;
    }
    case ts.SyntaxKind.NamespaceImport: {
      const ns = n as ts.NamespaceImport;
      const self: WritableDomainAst<DomainNamespaceImport> = {
        kind: DomainSyntaxKind.NamespaceImport,
        pos,
        end,
        parent,
        name: undefined as unknown as DomainIdentifier,
      };
      self.name = translateNode(ns.name, self as DomainNamespaceImport, sf) as DomainIdentifier;
      return self as DomainNamespaceImport;
    }
    case ts.SyntaxKind.ImportSpecifier: {
      const spec = n as ts.ImportSpecifier;
      const self: WritableDomainAst<DomainImportSpecifier> = {
        kind: DomainSyntaxKind.ImportSpecifier,
        pos,
        end,
        parent,
        propertyName: undefined,
        name: undefined as unknown as DomainIdentifier,
      };
      if (spec.propertyName) {
        self.propertyName = translateNode(
          spec.propertyName,
          self as DomainImportSpecifier,
          sf,
        ) as DomainIdentifier;
      }
      self.name = translateNode(spec.name, self as DomainImportSpecifier, sf) as DomainIdentifier;
      return self as DomainImportSpecifier;
    }
    case ts.SyntaxKind.CallExpression: {
      const call = n as ts.CallExpression;
      const self: WritableDomainAst<DomainCallExpression> = {
        kind: DomainSyntaxKind.CallExpression,
        pos,
        end,
        parent,
        expression: undefined as unknown as DomainAstNode,
        arguments: [],
      };
      self.expression = translateNode(call.expression, self as DomainCallExpression, sf);
      self.arguments = call.arguments.map((arg) =>
        translateNode(arg, self as DomainCallExpression, sf),
      );
      return self as DomainCallExpression;
    }
    case ts.SyntaxKind.PropertyAccessExpression: {
      const pa = n as ts.PropertyAccessExpression;
      const self: WritableDomainAst<DomainPropertyAccessExpression> = {
        kind: DomainSyntaxKind.PropertyAccessExpression,
        pos,
        end,
        parent,
        expression: undefined as unknown as DomainAstNode,
        name: undefined as unknown as DomainIdentifier,
      };
      self.expression = translateNode(pa.expression, self as DomainPropertyAccessExpression, sf);
      self.name = translateNode(
        pa.name,
        self as DomainPropertyAccessExpression,
        sf,
      ) as DomainIdentifier;
      return self as DomainPropertyAccessExpression;
    }
    case ts.SyntaxKind.ObjectLiteralExpression: {
      const obj = n as ts.ObjectLiteralExpression;
      const self: WritableDomainAst<DomainObjectLiteralExpression> = {
        kind: DomainSyntaxKind.ObjectLiteralExpression,
        pos,
        end,
        parent,
        properties: [],
      };
      const properties: DomainAstNode[] = [];
      for (const prop of obj.properties) {
        properties.push(translateNode(prop, self as DomainObjectLiteralExpression, sf));
      }
      return { ...self, properties } as DomainObjectLiteralExpression;
    }
    case ts.SyntaxKind.PropertyAssignment: {
      const prop = n as ts.PropertyAssignment;
      const self: WritableDomainAst<DomainPropertyAssignment> = {
        kind: DomainSyntaxKind.PropertyAssignment,
        pos,
        end,
        parent,
        name: undefined as unknown as DomainAstNode,
        initializer: undefined as unknown as DomainAstNode,
      };
      self.name = translateNode(prop.name, self as DomainPropertyAssignment, sf);
      self.initializer = translateNode(prop.initializer, self as DomainPropertyAssignment, sf);
      return self as DomainPropertyAssignment;
    }
    case ts.SyntaxKind.ArrayLiteralExpression: {
      const arr = n as ts.ArrayLiteralExpression;
      const self: WritableDomainAst<DomainArrayLiteralExpression> = {
        kind: DomainSyntaxKind.ArrayLiteralExpression,
        pos,
        end,
        parent,
        elements: [],
      };
      const elements: DomainAstNode[] = [];
      for (const element of arr.elements) {
        elements.push(translateNode(element, self as DomainArrayLiteralExpression, sf));
      }
      return { ...self, elements } as DomainArrayLiteralExpression;
    }
    case ts.SyntaxKind.SpreadElement: {
      const sp = n as ts.SpreadElement;
      const self: WritableDomainAst<DomainSpreadElement> = {
        kind: DomainSyntaxKind.SpreadElement,
        pos,
        end,
        parent,
        expression: undefined as unknown as DomainAstNode,
      };
      self.expression = translateNode(sp.expression, self as DomainSpreadElement, sf);
      return self as DomainSpreadElement;
    }
    case ts.SyntaxKind.ParenthesizedExpression: {
      const pe = n as ts.ParenthesizedExpression;
      const self: WritableDomainAst<DomainParenthesizedExpression> = {
        kind: DomainSyntaxKind.ParenthesizedExpression,
        pos,
        end,
        parent,
        expression: undefined as unknown as DomainAstNode,
      };
      self.expression = translateNode(pe.expression, self as DomainParenthesizedExpression, sf);
      return self as DomainParenthesizedExpression;
    }
    case ts.SyntaxKind.AsExpression: {
      const ae = n as ts.AsExpression;
      const self: WritableDomainAst<DomainAsExpression> = {
        kind: DomainSyntaxKind.AsExpression,
        pos,
        end,
        parent,
        expression: undefined as unknown as DomainAstNode,
      };
      self.expression = translateNode(ae.expression, self as DomainAsExpression, sf);
      return self as DomainAsExpression;
    }
    case ts.SyntaxKind.SatisfiesExpression: {
      const se = n as ts.SatisfiesExpression;
      const self: WritableDomainAst<DomainSatisfiesExpression> = {
        kind: DomainSyntaxKind.SatisfiesExpression,
        pos,
        end,
        parent,
        expression: undefined as unknown as DomainAstNode,
      };
      self.expression = translateNode(se.expression, self as DomainSatisfiesExpression, sf);
      return self as DomainSatisfiesExpression;
    }
    case ts.SyntaxKind.NonNullExpression: {
      const nn = n as ts.NonNullExpression;
      const self: WritableDomainAst<DomainNonNullExpression> = {
        kind: DomainSyntaxKind.NonNullExpression,
        pos,
        end,
        parent,
        expression: undefined as unknown as DomainAstNode,
      };
      self.expression = translateNode(nn.expression, self as DomainNonNullExpression, sf);
      return self as DomainNonNullExpression;
    }
    case ts.SyntaxKind.ConditionalExpression: {
      const ce = n as ts.ConditionalExpression;
      const self: WritableDomainAst<DomainConditionalExpression> = {
        kind: DomainSyntaxKind.ConditionalExpression,
        pos,
        end,
        parent,
        condition: undefined as unknown as DomainAstNode,
        whenTrue: undefined as unknown as DomainAstNode,
        whenFalse: undefined as unknown as DomainAstNode,
      };
      self.condition = translateNode(ce.condition, self as DomainConditionalExpression, sf);
      self.whenTrue = translateNode(ce.whenTrue, self as DomainConditionalExpression, sf);
      self.whenFalse = translateNode(ce.whenFalse, self as DomainConditionalExpression, sf);
      return self as DomainConditionalExpression;
    }
    case ts.SyntaxKind.BinaryExpression: {
      const be = n as ts.BinaryExpression;
      const self: WritableDomainAst<DomainBinaryExpression> = {
        kind: DomainSyntaxKind.BinaryExpression,
        pos,
        end,
        parent,
        left: undefined as unknown as DomainAstNode,
        operator: mapBinaryOperator(be.operatorToken),
        right: undefined as unknown as DomainAstNode,
      };
      self.left = translateNode(be.left, self as DomainBinaryExpression, sf);
      self.right = translateNode(be.right, self as DomainBinaryExpression, sf);
      return self as DomainBinaryExpression;
    }
    case ts.SyntaxKind.ExpressionStatement: {
      const es = n as ts.ExpressionStatement;
      const self: WritableDomainAst<DomainExpressionStatement> = {
        kind: DomainSyntaxKind.ExpressionStatement,
        pos,
        end,
        parent,
        expression: undefined as unknown as DomainAstNode,
      };
      self.expression = translateNode(es.expression, self as DomainExpressionStatement, sf);
      return self as DomainExpressionStatement;
    }
    case ts.SyntaxKind.JsxAttribute: {
      const ja = n as ts.JsxAttribute;
      const self: WritableDomainAst<DomainJsxAttribute> = {
        kind: DomainSyntaxKind.JsxAttribute,
        pos,
        end,
        parent,
        name: undefined as unknown as DomainAstNode,
        initializer: undefined,
      };
      self.name = translateNode(ja.name, self as DomainJsxAttribute, sf);
      if (ja.initializer) {
        self.initializer = translateNode(ja.initializer, self as DomainJsxAttribute, sf);
      }
      return self as DomainJsxAttribute;
    }
    case ts.SyntaxKind.JsxExpression: {
      const je = n as ts.JsxExpression;
      const self: WritableDomainAst<DomainJsxExpression> = {
        kind: DomainSyntaxKind.JsxExpression,
        pos,
        end,
        parent,
        expression: undefined,
      };
      if (je.expression) {
        self.expression = translateNode(je.expression, self as DomainJsxExpression, sf);
      }
      return self as DomainJsxExpression;
    }
    default:
      return translateUnknown(n, parent, sf);
  }
}

export function translateTypeScriptSourceFile(tsSf: ts.SourceFile): DomainSourceFile {
  const text = tsSf.getFullText();
  const statements = tsSf.statements.map((statement) => translateNode(statement, null, tsSf));
  return {
    fileName: tsSf.fileName,
    text,
    statements,
  } satisfies DomainSourceFile;
}

export function parseDomainSourceFile(filePath: string, sourceText: string): DomainSourceFile {
  const scriptKind = filePath.endsWith(".tsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const tsSf = ts.createSourceFile(filePath, sourceText, ts.ScriptTarget.Latest, true, scriptKind);
  return translateTypeScriptSourceFile(tsSf);
}
