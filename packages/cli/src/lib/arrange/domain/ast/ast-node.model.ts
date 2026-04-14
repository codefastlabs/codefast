/**
 * Pure-domain AST shapes for arrange analysis. No TypeScript compiler types.
 * Positions mirror `getStart(sourceFile)` / `getEnd()` semantics from translation.
 */

export enum DomainSyntaxKind {
  Unknown = 1,
  Identifier,
  StringLiteral,
  NoSubstitutionTemplateLiteral,
  ImportDeclaration,
  ImportClause,
  NamedImports,
  NamespaceImport,
  ImportSpecifier,
  CallExpression,
  PropertyAccessExpression,
  ObjectLiteralExpression,
  PropertyAssignment,
  ArrayLiteralExpression,
  SpreadElement,
  ParenthesizedExpression,
  AsExpression,
  SatisfiesExpression,
  NonNullExpression,
  ConditionalExpression,
  BinaryExpression,
  ExpressionStatement,
  JsxAttribute,
  JsxExpression,
}

export enum DomainBinaryOperator {
  Plus,
  Other,
}

export interface DomainSourceFile {
  readonly fileName: string;
  readonly text: string;
  readonly statements: readonly DomainAstNode[];
}

interface DomainNodeBase {
  readonly kind: DomainSyntaxKind;
  readonly pos: number;
  readonly end: number;
  readonly parent: DomainAstNode | null;
}

export interface DomainUnknownAstNode extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.Unknown;
  readonly children: readonly DomainAstNode[];
}

export interface DomainIdentifier extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.Identifier;
  readonly text: string;
}

export interface DomainStringLiteral extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.StringLiteral;
  readonly text: string;
}

export interface DomainNoSubstitutionTemplateLiteral extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.NoSubstitutionTemplateLiteral;
  readonly text: string;
}

export interface DomainImportDeclaration extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ImportDeclaration;
  readonly importClause: DomainImportClause | undefined;
  readonly moduleSpecifier: DomainAstNode;
}

export interface DomainImportClause extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ImportClause;
  readonly isTypeOnly: boolean;
  readonly name: DomainIdentifier | undefined;
  readonly namedBindings: DomainNamedImports | DomainNamespaceImport | undefined;
}

export interface DomainNamedImports extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.NamedImports;
  readonly elements: readonly DomainImportSpecifier[];
}

export interface DomainNamespaceImport extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.NamespaceImport;
  readonly name: DomainIdentifier;
}

export interface DomainImportSpecifier extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ImportSpecifier;
  readonly name: DomainIdentifier;
  readonly propertyName: DomainIdentifier | undefined;
}

export interface DomainCallExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.CallExpression;
  readonly expression: DomainAstNode;
  readonly arguments: readonly DomainAstNode[];
}

export interface DomainPropertyAccessExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.PropertyAccessExpression;
  readonly expression: DomainAstNode;
  readonly name: DomainIdentifier;
}

export interface DomainObjectLiteralExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ObjectLiteralExpression;
  readonly properties: readonly DomainAstNode[];
}

export interface DomainPropertyAssignment extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.PropertyAssignment;
  readonly name: DomainAstNode;
  readonly initializer: DomainAstNode;
}

export interface DomainArrayLiteralExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ArrayLiteralExpression;
  readonly elements: readonly DomainAstNode[];
}

export interface DomainSpreadElement extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.SpreadElement;
  readonly expression: DomainAstNode;
}

export interface DomainParenthesizedExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ParenthesizedExpression;
  readonly expression: DomainAstNode;
}

export interface DomainAsExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.AsExpression;
  readonly expression: DomainAstNode;
}

export interface DomainSatisfiesExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.SatisfiesExpression;
  readonly expression: DomainAstNode;
}

export interface DomainNonNullExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.NonNullExpression;
  readonly expression: DomainAstNode;
}

export interface DomainConditionalExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ConditionalExpression;
  readonly condition: DomainAstNode;
  readonly whenTrue: DomainAstNode;
  readonly whenFalse: DomainAstNode;
}

export interface DomainBinaryExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.BinaryExpression;
  readonly left: DomainAstNode;
  readonly operator: DomainBinaryOperator;
  readonly right: DomainAstNode;
}

export interface DomainExpressionStatement extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ExpressionStatement;
  readonly expression: DomainAstNode;
}

export interface DomainJsxAttribute extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.JsxAttribute;
  readonly name: DomainAstNode;
  readonly initializer: DomainAstNode | undefined;
}

export interface DomainJsxExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.JsxExpression;
  readonly expression: DomainAstNode | undefined;
}

export type DomainAstNode =
  | DomainUnknownAstNode
  | DomainIdentifier
  | DomainStringLiteral
  | DomainNoSubstitutionTemplateLiteral
  | DomainImportDeclaration
  | DomainImportClause
  | DomainNamedImports
  | DomainNamespaceImport
  | DomainImportSpecifier
  | DomainCallExpression
  | DomainPropertyAccessExpression
  | DomainObjectLiteralExpression
  | DomainPropertyAssignment
  | DomainArrayLiteralExpression
  | DomainSpreadElement
  | DomainParenthesizedExpression
  | DomainAsExpression
  | DomainSatisfiesExpression
  | DomainNonNullExpression
  | DomainConditionalExpression
  | DomainBinaryExpression
  | DomainExpressionStatement
  | DomainJsxAttribute
  | DomainJsxExpression;

export type DomainTailwindClassLiteral = DomainStringLiteral | DomainNoSubstitutionTemplateLiteral;

export function isDomainIdentifier(node: DomainAstNode): node is DomainIdentifier {
  return node.kind === DomainSyntaxKind.Identifier;
}

export function isDomainStringLiteral(node: DomainAstNode): node is DomainStringLiteral {
  return node.kind === DomainSyntaxKind.StringLiteral;
}

export function isDomainNoSubstitutionTemplateLiteral(
  node: DomainAstNode,
): node is DomainNoSubstitutionTemplateLiteral {
  return node.kind === DomainSyntaxKind.NoSubstitutionTemplateLiteral;
}

export function isDomainTailwindClassLiteral(
  node: DomainAstNode,
): node is DomainTailwindClassLiteral {
  return isDomainStringLiteral(node) || isDomainNoSubstitutionTemplateLiteral(node);
}

export function isDomainImportDeclaration(node: DomainAstNode): node is DomainImportDeclaration {
  return node.kind === DomainSyntaxKind.ImportDeclaration;
}

export function isDomainImportClause(node: DomainAstNode | undefined): node is DomainImportClause {
  return node !== undefined && node.kind === DomainSyntaxKind.ImportClause;
}

export function isDomainNamedImports(node: DomainAstNode): node is DomainNamedImports {
  return node.kind === DomainSyntaxKind.NamedImports;
}

export function isDomainNamespaceImport(node: DomainAstNode): node is DomainNamespaceImport {
  return node.kind === DomainSyntaxKind.NamespaceImport;
}

export function isDomainCallExpression(node: DomainAstNode): node is DomainCallExpression {
  return node.kind === DomainSyntaxKind.CallExpression;
}

export function isDomainObjectLiteralExpression(
  node: DomainAstNode,
): node is DomainObjectLiteralExpression {
  return node.kind === DomainSyntaxKind.ObjectLiteralExpression;
}

export function isDomainPropertyAssignment(node: DomainAstNode): node is DomainPropertyAssignment {
  return node.kind === DomainSyntaxKind.PropertyAssignment;
}

export function isDomainArrayLiteralExpression(
  node: DomainAstNode,
): node is DomainArrayLiteralExpression {
  return node.kind === DomainSyntaxKind.ArrayLiteralExpression;
}

export function isDomainSpreadElement(node: DomainAstNode): node is DomainSpreadElement {
  return node.kind === DomainSyntaxKind.SpreadElement;
}

export function isDomainPropertyAccessExpression(
  node: DomainAstNode,
): node is DomainPropertyAccessExpression {
  return node.kind === DomainSyntaxKind.PropertyAccessExpression;
}

export function isDomainJsxAttribute(node: DomainAstNode): node is DomainJsxAttribute {
  return node.kind === DomainSyntaxKind.JsxAttribute;
}

export function isDomainJsxExpression(node: DomainAstNode): node is DomainJsxExpression {
  return node.kind === DomainSyntaxKind.JsxExpression;
}

export function isDomainExpressionStatement(
  node: DomainAstNode,
): node is DomainExpressionStatement {
  return node.kind === DomainSyntaxKind.ExpressionStatement;
}

export function forEachDomainChild(
  node: DomainAstNode,
  visit: (child: DomainAstNode) => void,
): void {
  switch (node.kind) {
    case DomainSyntaxKind.Unknown:
      for (const child of node.children) {
        visit(child);
      }
      return;
    case DomainSyntaxKind.ImportDeclaration:
      if (node.importClause) {
        visit(node.importClause);
      }
      visit(node.moduleSpecifier);
      return;
    case DomainSyntaxKind.ImportClause:
      if (node.name) {
        visit(node.name);
      }
      if (node.namedBindings) {
        visit(node.namedBindings);
      }
      return;
    case DomainSyntaxKind.NamedImports:
      for (const element of node.elements) {
        visit(element);
      }
      return;
    case DomainSyntaxKind.NamespaceImport:
      visit(node.name);
      return;
    case DomainSyntaxKind.ImportSpecifier:
      if (node.propertyName) {
        visit(node.propertyName);
      }
      visit(node.name);
      return;
    case DomainSyntaxKind.CallExpression:
      visit(node.expression);
      for (const arg of node.arguments) {
        visit(arg);
      }
      return;
    case DomainSyntaxKind.PropertyAccessExpression:
      visit(node.expression);
      visit(node.name);
      return;
    case DomainSyntaxKind.ObjectLiteralExpression:
      for (const prop of node.properties) {
        visit(prop);
      }
      return;
    case DomainSyntaxKind.PropertyAssignment:
      visit(node.name);
      visit(node.initializer);
      return;
    case DomainSyntaxKind.ArrayLiteralExpression:
      for (const element of node.elements) {
        visit(element);
      }
      return;
    case DomainSyntaxKind.SpreadElement:
      visit(node.expression);
      return;
    case DomainSyntaxKind.ParenthesizedExpression:
    case DomainSyntaxKind.AsExpression:
    case DomainSyntaxKind.SatisfiesExpression:
    case DomainSyntaxKind.NonNullExpression:
      visit(node.expression);
      return;
    case DomainSyntaxKind.ConditionalExpression:
      visit(node.condition);
      visit(node.whenTrue);
      visit(node.whenFalse);
      return;
    case DomainSyntaxKind.BinaryExpression:
      visit(node.left);
      visit(node.right);
      return;
    case DomainSyntaxKind.ExpressionStatement:
      visit(node.expression);
      return;
    case DomainSyntaxKind.JsxAttribute:
      visit(node.name);
      if (node.initializer) {
        visit(node.initializer);
      }
      return;
    case DomainSyntaxKind.JsxExpression:
      if (node.expression) {
        visit(node.expression);
      }
      return;
    default:
      return;
  }
}

export function forEachDomainDescendant(
  node: DomainAstNode,
  visit: (n: DomainAstNode) => void,
): void {
  visit(node);
  forEachDomainChild(node, (child) => forEachDomainDescendant(child, visit));
}

export function forEachDomainDescendantFromSourceFile(
  sourceFile: DomainSourceFile,
  visit: (n: DomainAstNode) => void,
): void {
  for (const statement of sourceFile.statements) {
    forEachDomainDescendant(statement, visit);
  }
}

export function findFirstDomainDescendantWhere(
  sourceFile: DomainSourceFile,
  predicate: (n: DomainAstNode) => boolean,
): DomainAstNode | undefined {
  let found: DomainAstNode | undefined;
  forEachDomainDescendantFromSourceFile(sourceFile, (n) => {
    if (found === undefined && predicate(n)) {
      found = n;
    }
  });
  return found;
}

export function lineOfSourcePosition(sourceText: string, pos: number): number {
  const boundedPos = Math.max(0, Math.min(pos, sourceText.length));
  let line = 1;
  for (let i = 0; i < boundedPos; i++) {
    if (sourceText.charCodeAt(i) === 10) {
      line++;
    }
  }
  return line;
}
