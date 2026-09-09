import { describe, expect, it } from "vitest";

import { auditDisplayNames } from "#/audit/display-names/domain/display-names";

describe("auditDisplayNames", () => {
  it("flags a token(), a tag() and a module name without a namespace, with their lines", () => {
    const source = [
      `const Logger = token<Logger>("Logger");`,
      `const Fuel = tag<"petrol" | "electric">("fuel");`,
      `const Infra = Module.create("Infra", () => {});`,
      ``,
    ].join("\n");
    const violations = auditDisplayNames(source);
    expect(violations).toHaveLength(3);
    expect(violations[0]).toMatchObject({ line: 1, raw: `token<Logger>("Logger")` });
    expect(violations[0]?.reason).toContain("'<namespace>:Logger'");
    expect(violations[1]).toMatchObject({ line: 2, raw: `tag<"petrol" | "electric">("fuel")` });
    expect(violations[2]).toMatchObject({ line: 3, raw: `Module.create("Infra"` });
    expect(violations[2]?.reason).toContain("module name 'Infra' has no namespace");
  });

  it("accepts each kind spelled like the symbol it stands for, under a kebab-case or scoped namespace", () => {
    const source = [
      `token<Logger>("app:Logger");`,
      `token<Config>("@scope/pkg:Config");`,
      `token<Logger, "console" | "file">("basic-tokens:Logger");`,
      `tag<string>("di:name");`,
      `tag<"gold" | "silver">("shop:cacheTier");`,
      `Module.create("shop:Infra", () => {});`,
      `Module.createAsync("shop:Database", async () => {});`,
      `SyncModule.create("app:Core", () => {});`,
      `AsyncModule.create("app:Root", async () => {});`,
      ``,
    ].join("\n");
    expect(auditDisplayNames(source)).toEqual([]);
  });

  it("checks the case of the name half by kind", () => {
    const token = auditDisplayNames(`token<Logger>("app:logger");`);
    expect(token).toHaveLength(1);
    expect(token[0]?.reason).toContain("is not PascalCase — a token stands for a type");

    const tag = auditDisplayNames(`tag<string>("app:Region");`);
    expect(tag).toHaveLength(1);
    expect(tag[0]?.reason).toContain("is not camelCase — a tag key names an attribute");

    const module = auditDisplayNames(`Module.create("tasks:validation", () => {});`);
    expect(module).toHaveLength(1);
    expect(module[0]?.reason).toContain("is not PascalCase — a module stands for a unit of composition");
  });

  it("checks the namespace half and rejects empty halves", () => {
    expect(auditDisplayNames(`token<A>("App:Logger");`)[0]?.reason).toContain("namespace 'App'");
    expect(auditDisplayNames(`token<A>("my_app:Logger");`)[0]?.reason).toContain("namespace 'my_app'");
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
      `builder.Module.create("Infra", () => {});`,
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
