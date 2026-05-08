/**
 * Pure-domain AST shapes for arrange analysis. No TypeScript compiler types.
 * Positions mirror `getStart(sourceFile)` / `getEnd()` semantics from translation.
 *
 * @since 0.3.16-canary.0
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

/**
 * @since 0.3.16-canary.0
 */
export enum DomainBinaryOperator {
  Plus,
  Other,
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainSourceFile {
  readonly fileName: string;
  readonly text: string;
  readonly statements: ReadonlyArray<DomainAstNode>;
}

interface DomainNodeBase {
  readonly kind: DomainSyntaxKind;
  readonly pos: number;
  readonly end: number;
  readonly parent: DomainAstNode | null;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainUnknownAstNode extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.Unknown;
  readonly children: ReadonlyArray<DomainAstNode>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainIdentifier extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.Identifier;
  readonly text: string;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainStringLiteral extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.StringLiteral;
  readonly text: string;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainNoSubstitutionTemplateLiteral extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.NoSubstitutionTemplateLiteral;
  readonly text: string;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainImportDeclaration extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ImportDeclaration;
  readonly importClause: DomainImportClause | undefined;
  readonly moduleSpecifier: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainImportClause extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ImportClause;
  readonly isTypeOnly: boolean;
  readonly name: DomainIdentifier | undefined;
  readonly namedBindings: DomainNamedImports | DomainNamespaceImport | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainNamedImports extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.NamedImports;
  readonly elements: ReadonlyArray<DomainImportSpecifier>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainNamespaceImport extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.NamespaceImport;
  readonly name: DomainIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainImportSpecifier extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ImportSpecifier;
  readonly name: DomainIdentifier;
  readonly propertyName: DomainIdentifier | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainCallExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.CallExpression;
  readonly expression: DomainAstNode;
  readonly arguments: ReadonlyArray<DomainAstNode>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainPropertyAccessExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.PropertyAccessExpression;
  readonly expression: DomainAstNode;
  readonly name: DomainIdentifier;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainObjectLiteralExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ObjectLiteralExpression;
  readonly properties: ReadonlyArray<DomainAstNode>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainPropertyAssignment extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.PropertyAssignment;
  readonly name: DomainAstNode;
  readonly initializer: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainArrayLiteralExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ArrayLiteralExpression;
  readonly elements: ReadonlyArray<DomainAstNode>;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainSpreadElement extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.SpreadElement;
  readonly expression: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainParenthesizedExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ParenthesizedExpression;
  readonly expression: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainAsExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.AsExpression;
  readonly expression: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainSatisfiesExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.SatisfiesExpression;
  readonly expression: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainNonNullExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.NonNullExpression;
  readonly expression: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainConditionalExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ConditionalExpression;
  readonly condition: DomainAstNode;
  readonly whenTrue: DomainAstNode;
  readonly whenFalse: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainBinaryExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.BinaryExpression;
  readonly left: DomainAstNode;
  readonly operator: DomainBinaryOperator;
  readonly right: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainExpressionStatement extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.ExpressionStatement;
  readonly expression: DomainAstNode;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainJsxAttribute extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.JsxAttribute;
  readonly name: DomainAstNode;
  readonly initializer: DomainAstNode | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
export interface DomainJsxExpression extends DomainNodeBase {
  readonly kind: DomainSyntaxKind.JsxExpression;
  readonly expression: DomainAstNode | undefined;
}

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
export type DomainTailwindClassLiteral = DomainStringLiteral | DomainNoSubstitutionTemplateLiteral;

/**
 * @since 0.3.16-canary.0
 */
export function isDomainIdentifier(node: DomainAstNode): node is DomainIdentifier {
  return node.kind === DomainSyntaxKind.Identifier;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainStringLiteral(node: DomainAstNode): node is DomainStringLiteral {
  return node.kind === DomainSyntaxKind.StringLiteral;
}

function isDomainNoSubstitutionTemplateLiteral(
  node: DomainAstNode,
): node is DomainNoSubstitutionTemplateLiteral {
  return node.kind === DomainSyntaxKind.NoSubstitutionTemplateLiteral;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainTailwindClassLiteral(
  node: DomainAstNode,
): node is DomainTailwindClassLiteral {
  return isDomainStringLiteral(node) || isDomainNoSubstitutionTemplateLiteral(node);
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainImportDeclaration(node: DomainAstNode): node is DomainImportDeclaration {
  return node.kind === DomainSyntaxKind.ImportDeclaration;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainNamedImports(node: DomainAstNode): node is DomainNamedImports {
  return node.kind === DomainSyntaxKind.NamedImports;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainNamespaceImport(node: DomainAstNode): node is DomainNamespaceImport {
  return node.kind === DomainSyntaxKind.NamespaceImport;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainCallExpression(node: DomainAstNode): node is DomainCallExpression {
  return node.kind === DomainSyntaxKind.CallExpression;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainObjectLiteralExpression(
  node: DomainAstNode,
): node is DomainObjectLiteralExpression {
  return node.kind === DomainSyntaxKind.ObjectLiteralExpression;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainPropertyAssignment(node: DomainAstNode): node is DomainPropertyAssignment {
  return node.kind === DomainSyntaxKind.PropertyAssignment;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainArrayLiteralExpression(
  node: DomainAstNode,
): node is DomainArrayLiteralExpression {
  return node.kind === DomainSyntaxKind.ArrayLiteralExpression;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainSpreadElement(node: DomainAstNode): node is DomainSpreadElement {
  return node.kind === DomainSyntaxKind.SpreadElement;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainPropertyAccessExpression(
  node: DomainAstNode,
): node is DomainPropertyAccessExpression {
  return node.kind === DomainSyntaxKind.PropertyAccessExpression;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainJsxAttribute(node: DomainAstNode): node is DomainJsxAttribute {
  return node.kind === DomainSyntaxKind.JsxAttribute;
}

/**
 * @since 0.3.16-canary.0
 */
export function isDomainJsxExpression(node: DomainAstNode): node is DomainJsxExpression {
  return node.kind === DomainSyntaxKind.JsxExpression;
}

/**
 * @since 0.3.16-canary.0
 */
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

/**
 * @since 0.3.16-canary.0
 */
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
