import { describe, expect, it } from "vitest";

import type { ConstituentKind, PropsIntersection } from "#audit/props/domain/props-intersection";
import { findPropsIntersections, judgePropsIntersection } from "#audit/props/domain/props-intersection";

function find(source: string): Array<PropsIntersection> {
  return findPropsIntersections("a.tsx", source);
}

function only(source: string): PropsIntersection {
  const [intersection, ...rest] = find(source);
  expect(rest).toStrictEqual([]);
  if (intersection === undefined) {
    throw new Error("expected one props intersection");
  }
  return intersection;
}

describe("findPropsIntersections", () => {
  it("finds a props alias joined with & at its top level, exported or not", () => {
    const found = find(
      [
        'export type ButtonProps = ComponentProps<"button"> &',
        "  ButtonVariants & {",
        "    asChild?: boolean;",
        "  };",
        "type CardProps = Base & { size?: string };",
      ].join("\n"),
    );

    expect(found.map(({ site, line, raw, wrapper }) => ({ site, line, raw, wrapper }))).toStrictEqual([
      { site: "alias", line: 1, raw: 'type ButtonProps = ComponentProps<"button"> &', wrapper: undefined },
      { site: "alias", line: 5, raw: "type CardProps = Base & { size?: string };", wrapper: undefined },
    ]);
    expect(found[0]?.parts.map(({ text }) => text)).toStrictEqual([
      'ComponentProps<"button">',
      "ButtonVariants",
      "{\n    asChild?: boolean;\n  }",
    ]);
  });

  it("finds an intersection passed to the type a props alias wraps, naming the wrapper", () => {
    const intersection = only("type ScrollAreaProps = ScopedProps<RootProps & ContextValue>;");

    expect(intersection.wrapper).toBe("ScopedProps");
    expect(intersection.parts.map(({ text }) => text)).toStrictEqual(["RootProps", "ContextValue"]);
  });

  it("records each part's span so the type checker can find the same node", () => {
    const source = "type AProps = Base & Extra;";
    const { parts } = only(source);

    expect(parts.map(({ start, end }) => source.slice(start, end))).toStrictEqual(["Base", "Extra"]);
  });

  it("passes over a plain alias, an interface, and an intersection not named for props", () => {
    expect(
      find(
        [
          'type PlainProps = ComponentProps<"div">;',
          "type WrappedProps = ScopedProps<RootProps>;",
          "interface BoxProps extends Base { a?: string }",
          "type ContextValue = Base & { open: boolean };",
        ].join("\n"),
      ),
    ).toStrictEqual([]);
  });

  it("finds an intersection annotating the first parameter of any function in a .tsx file", () => {
    const found = find(
      [
        'function ListItem({ href, ...props }: ComponentProps<"li"> & { href: string }) {}',
        "const Card = (props: (Base & Extra)) => null;",
        'const Row = memo(function Row(this: Window, { a }: Base & { a: string } = { a: "" }) {});',
        "class Panel { render(props: Base & Extra) {} }",
      ].join("\n"),
    );

    expect(found.map(({ site, line, raw }) => ({ site, line, raw }))).toStrictEqual([
      { site: "parameter", line: 1, raw: 'ComponentProps<"li"> & { href: string }' },
      { site: "parameter", line: 2, raw: "(Base & Extra)" },
      { site: "parameter", line: 3, raw: "Base & { a: string }" },
      { site: "parameter", line: 4, raw: "Base & Extra" },
    ]);
    expect(found[1]?.parts.map(({ text }) => text)).toStrictEqual(["Base", "Extra"]);
  });

  it("passes over a parameter not annotated with a top-level intersection, a later parameter, and a .ts file", () => {
    const source = [
      'function Plain(props: ComponentProps<"div">) {}',
      "function Wrapped(props: ScopedProps<Base & Extra>) {}",
      "function Bare({ a }) {}",
      "function Second(ref: Ref, props: Base & Extra) {}",
    ].join("\n");

    expect(find(source)).toStrictEqual([]);
    expect(findPropsIntersections("a.ts", "function ListItem(props: Base & Extra) {}")).toStrictEqual([]);
  });
});

describe("judgePropsIntersection", () => {
  const intersection = only("type AProps = Base & Extra;");

  function judge(kinds: Array<ConstituentKind>) {
    return judgePropsIntersection(intersection, kinds);
  }

  it("reports an intersection an interface could extend part by part", () => {
    expect(judge(["object", "object"])).toStrictEqual({
      line: 1,
      raw: "type AProps = Base & Extra;",
      reason: expect.stringContaining("declare an interface that extends them"),
    });
  });

  it("keeps the type when a part is a union, a type parameter or not an object", () => {
    expect(judge(["union", "object"])).toBeUndefined();
    expect(judge(["object", "type-parameter"])).toBeUndefined();
    expect(judge(["other", "object"])).toBeUndefined();
  });

  it("reports a part that did not resolve, naming it, rather than letting it pass", () => {
    expect(judge(["unresolved", "union"])?.reason).toContain("`Base` did not resolve to a type");
    expect(judge(["object"])?.reason).toContain("`Extra` did not resolve to a type");
  });

  it("names the wrapper when the intersection is passed to one", () => {
    const wrapped = only("type BProps = ScopedProps<Base & Extra>;");

    expect(judgePropsIntersection(wrapped, ["object", "object"])?.reason).toContain("passed to `ScopedProps`");
  });

  it("asks for a named interface when the intersection is written inline on a parameter", () => {
    const inline = only("function Box(props: Base & Extra) {}");

    expect(judgePropsIntersection(inline, ["object", "object"])).toStrictEqual({
      line: 1,
      raw: "Base & Extra",
      reason: expect.stringContaining("joins object types with `&` inline — name it as an interface that extends them"),
    });
    expect(judgePropsIntersection(inline, ["union", "object"])).toBeUndefined();
  });
});
