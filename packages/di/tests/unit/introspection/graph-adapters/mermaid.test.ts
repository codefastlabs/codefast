import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { injectable } from "#/decorators/injectable";
import { injectAll, optional } from "#/injection/descriptor";
import { toMermaidGraph } from "#/introspection/graph-adapters/mermaid";

describe("toMermaidGraph", () => {
  it("renders a flowchart with every node and edge", () => {
    const configToken = token<number>("config");
    const serviceToken = token<{ config: number }>("service");
    const container = Container.create();
    container.bind(configToken).toConstantValue(1);
    container.bind(serviceToken).toResolved((config) => ({ config }), [configToken]);

    const mermaid = toMermaidGraph(container.generateDependencyGraph());

    expect(mermaid).toMatch(/^flowchart TD/);
    expect(mermaid).toContain('n0["config<br/>constant · singleton"]');
    expect(mermaid).toContain('n1["service<br/>resolved · transient"]');
    expect(mermaid).toContain('n1 -->|"[0]"| n0');
  });

  it("marks unbound placeholders and parent-chain nodes with class defs", () => {
    const metricsToken = token<number>("metrics");
    const configToken = token<number>("config");
    @injectable([optional(metricsToken)])
    class Service {
      constructor(readonly metrics: number | undefined) {}
    }
    const root = Container.create();
    root.bind(configToken).toConstantValue(1);
    const child = root.createChild();
    child.bind(Service).toSelf().singleton();

    const mermaid = toMermaidGraph(child.generateDependencyGraph({ includeParent: true }));

    expect(mermaid).toContain('-->|"[0] optional"|');
    expect(mermaid).toMatch(/classDef unbound/);
    expect(mermaid).toMatch(/classDef fromParent/);
  });

  it("fans multi-binding edges out with quoted slot labels", () => {
    const validatorToken = token<string>("validator");
    @injectable([injectAll(validatorToken)])
    class Composite {
      constructor(readonly validators: Array<string>) {}
    }
    const container = Container.create();
    container.bind(validatorToken).toConstantValue("a").whenNamed("first");
    container.bind(validatorToken).toConstantValue("b").whenNamed("second");
    container.bind(Composite).toSelf().singleton();

    const mermaid = toMermaidGraph(container.generateDependencyGraph());

    expect(mermaid).toContain('|"name:first"|');
    expect(mermaid).toContain('|"name:second"|');
  });

  it("escapes quotes and markup in token names so they cannot inject Mermaid directives", () => {
    const directiveToken = token<number>('x"]; click n0 href "javascript:alert(1)"; %%');
    const markupToken = token<number>("<img src=x onerror=alert(1)>");
    const container = Container.create();
    container.bind(directiveToken).toConstantValue(1);
    container.bind(markupToken).toConstantValue(2);

    const mermaid = toMermaidGraph(container.generateDependencyGraph());

    // The label string must never be closed early, and raw markup must not pass through.
    expect(mermaid).not.toContain('"];');
    expect(mermaid).not.toContain("<img");
    expect(mermaid).toContain("#34;");
    expect(mermaid).toContain("#60;img src=x onerror=alert(1)#62;");
  });
});
