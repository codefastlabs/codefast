import {
  DomainSyntaxKind,
  type DomainAstNode,
  forEachDomainChild,
  isDomainCallExpression,
} from "#/lib/arrange/domain/ast/ast-node.model";

describe("ast-node.model guards", () => {
  it("isDomainCallExpression rejects non-call nodes", () => {
    const notCall: DomainAstNode = {
      kind: DomainSyntaxKind.Unknown,
      pos: 0,
      end: 0,
      parent: null,
      children: [],
    };
    expect(isDomainCallExpression(notCall)).toBe(false);
  });

  it("forEachDomainChild visits children of Unknown nodes", () => {
    const child: DomainAstNode = {
      kind: DomainSyntaxKind.Unknown,
      pos: 1,
      end: 2,
      parent: null,
      children: [],
    };
    const root: DomainAstNode = {
      kind: DomainSyntaxKind.Unknown,
      pos: 0,
      end: 3,
      parent: null,
      children: [child],
    };
    const visit = vi.fn();
    forEachDomainChild(root, visit);
    expect(visit).toHaveBeenCalledWith(child);
  });
});
