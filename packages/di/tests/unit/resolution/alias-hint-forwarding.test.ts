/**
 * A default-slot alias is a transparent pointer: a request whose criteria no slot of the alias's own
 * token matches is forwarded, criteria and all, to the alias's target — while an exact slot on the
 * token still wins, and an alias with a slot of its own is selected by that slot alone.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { tag } from "#core/tag";
import { token } from "#core/token";
import { NoMatchingBindingError } from "#errors/errors";

const REGION = tag("ahf:region");

function loggers(): { container: Container; abstract: ReturnType<typeof token<string>> } {
  const logger = token<string>("ahf:Logger");
  const abstract = token<string>("ahf:AbstractLogger");
  const container = Container.create();
  container.bind(logger).toConstantValue("console").whenNamed("console");
  container.bind(logger).toConstantValue("file").whenNamed("file");
  container.bind(logger).toConstantValue("eu").whenTagged(REGION.of("eu"));
  container.bind(abstract).toAlias(logger);
  return { container, abstract };
}

describe("hint forwarding through a default-slot alias", () => {
  it("forwards a name the alias's token has no slot for", () => {
    const { container, abstract } = loggers();

    expect(container.resolve(abstract, { name: "file" })).toBe("file");
    expect(container.resolve(abstract, { name: "console" })).toBe("console");
  });

  it("forwards a tag criterion the same way", () => {
    const { container, abstract } = loggers();

    expect(container.resolve(abstract, { tag: REGION.of("eu") })).toBe("eu");
  });

  it("forwards on the optional and async lanes, and existence agrees", async () => {
    const { container, abstract } = loggers();

    expect(container.resolveOptional(abstract, { name: "file" })).toBe("file");
    expect(container.resolveOptional(abstract, { name: "missing" })).toBeUndefined();
    await expect(container.resolveAsync(abstract, { name: "file" })).resolves.toBe("file");
    expect(container.has(abstract, { name: "file" })).toBe(true);
  });

  it("reports the target's miss when the forwarded criteria match nothing there", () => {
    const { container, abstract } = loggers();

    expect(() => container.resolve(abstract, { name: "missing" })).toThrow(NoMatchingBindingError);
    expect(() => container.resolve(abstract, { name: "missing" })).toThrow(/ahf:Logger/);
  });

  it("lets an exact slot on the alias's own token win over forwarding", () => {
    const { container, abstract } = loggers();
    container.bind(abstract).toConstantValue("own-file").whenNamed("file");

    expect(container.resolve(abstract, { name: "file" })).toBe("own-file");
    expect(container.resolve(abstract, { name: "console" })).toBe("console");
  });

  it("selects a slotted alias by its own slot and forwards the request unchanged", () => {
    const logger = token<string>("ahf:AuditLogger");
    const abstract = token<string>("ahf:AbstractAuditLogger");
    const container = Container.create();
    container.bind(logger).toConstantValue("audit").whenNamed("audit");
    container.bind(abstract).toAlias(logger).whenNamed("audit");

    expect(container.resolve(abstract, { name: "audit" })).toBe("audit");
    expect(() => container.resolve(abstract, { name: "other" })).toThrow(NoMatchingBindingError);
  });

  it("forwards from a child's alias before walking up to the parent", () => {
    const logger = token<string>("ahf:ChildLogger");
    const abstract = token<string>("ahf:ChildAbstract");
    const root = Container.create();
    root.bind(abstract).toConstantValue("parent-file").whenNamed("file");
    const child = root.createChild();
    child.bind(logger).toConstantValue("child-file").whenNamed("file");
    child.bind(abstract).toAlias(logger);

    // The nearest container that can answer does, as it would for any other binding.
    expect(child.resolve(abstract, { name: "file" })).toBe("child-file");
  });
});
