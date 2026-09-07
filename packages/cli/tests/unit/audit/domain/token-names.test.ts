import { describe, expect, it } from "vitest";

import { auditDisplayNames } from "#/audit/domain/token-names";

describe("auditDisplayNames", () => {
  it("flags a token() and a tag() display name without a namespace, with their lines", () => {
    const source = [
      `const Logger = token<Logger>("Logger");`,
      `const Fuel = tag<"petrol" | "electric">("fuel");`,
      ``,
    ].join("\n");
    const violations = auditDisplayNames(source);
    expect(violations).toHaveLength(2);
    expect(violations[0]).toMatchObject({ line: 1, raw: `token<Logger>("Logger")` });
    expect(violations[0]?.reason).toContain("'<namespace>:Logger'");
    expect(violations[1]).toMatchObject({ line: 2, raw: `tag<"petrol" | "electric">("fuel")` });
  });

  it("accepts a namespaced name, a scoped-package namespace, and the reserved key", () => {
    const source = [
      `token<Logger>("app:Logger");`,
      `token<Config>("@scope/pkg:Config");`,
      `tag<string>("di:name");`,
      `token<Logger, "console" | "file">("shop:Logger");`,
      ``,
    ].join("\n");
    expect(auditDisplayNames(source)).toEqual([]);
  });

  it("rejects an empty half on either side of the colon", () => {
    expect(auditDisplayNames(`token<A>(":Logger");`)).toHaveLength(1);
    expect(auditDisplayNames(`token<A>("app:");`)).toHaveLength(1);
    expect(auditDisplayNames(`token<A>("app: Logger");`)).toHaveLength(1);
  });

  it("reads through nested generics and single quotes", () => {
    const source = `const Deep = token<Map<string, Array<Set<number>>>>('Deep');\n`;
    const violations = auditDisplayNames(source);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.raw).toBe(`token<Map<string, Array<Set<number>>>>('Deep')`);
  });

  it("ignores member calls, other identifiers, non-literal names and prose", () => {
    const source = [
      `registry.token("Logger");`,
      `tokenName("Logger");`,
      `const name = "Logger"; token<Logger>(name);`,
      "token<Logger>(`Logger`);",
      `// the tag (a criterion) is minted by the key`,
      ``,
    ].join("\n");
    expect(auditDisplayNames(source)).toEqual([]);
  });

  it("scans markdown code samples the same way", () => {
    const markdown = ["# Tokens", "", "```ts", `const Db = token<Database>("Database");`, "```", ""].join("\n");
    const violations = auditDisplayNames(markdown);
    expect(violations).toHaveLength(1);
    expect(violations[0]?.line).toBe(4);
  });
});
