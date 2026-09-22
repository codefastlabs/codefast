/**
 * An alias is a transparent pointer, so an optional or collection read through one that ends nowhere
 * is a miss — `undefined` or an empty list — never a throw; a required resolve and an alias cycle
 * still throw.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { CircularDependencyError, TokenNotBoundError } from "#errors/errors";

describe("a dangling alias is a miss on the optional and collection lanes", () => {
  it("resolveOptional returns undefined through an alias to an unbound token", () => {
    const facade = token<string>("da:Facade");
    const missing = token<string>("da:Missing");
    const container = Container.create();
    container.bind(facade).toAlias(missing);

    expect(container.resolveOptional(facade)).toBeUndefined();
  });

  it("resolveOptionalAsync returns undefined through an alias to an unbound token", async () => {
    const facade = token<string>("da:FacadeAsync");
    const missing = token<string>("da:MissingAsync");
    const container = Container.create();
    container.bind(facade).toAlias(missing);

    await expect(container.resolveOptionalAsync(facade)).resolves.toBeUndefined();
  });

  it("resolveAll and resolveAllAsync never throw through a dangling alias", async () => {
    const facade = token<string>("da:FacadeAll");
    const missing = token<string>("da:MissingAll");
    const container = Container.create();
    container.bind(facade).toAlias(missing);

    expect(container.resolveAll(facade)).toStrictEqual([]);
    await expect(container.resolveAllAsync(facade)).resolves.toStrictEqual([]);
  });

  it("skips a dangling alias member but keeps the live members, in order", () => {
    const service = token<string>("da:Svc");
    const missing = token<string>("da:SvcMissing");
    const container = Container.create();
    container.bind(service).toConstantValue("live").many();
    container.bind(service).toAlias(missing).many();

    expect(container.resolveAll(service)).toStrictEqual(["live"]);
  });

  it("returns undefined through an alias whose target has no matching slot", () => {
    const facade = token<string>("da:FacadeNoSlot");
    const impl = token<string>("da:Impl");
    const container = Container.create();
    container.bind(facade).toAlias(impl);
    // The target is bound, but only on a named slot the hint-less request cannot select.
    container.bind(impl).toConstantValue("named").whenNamed("primary");

    expect(container.resolveOptional(facade)).toBeUndefined();
    expect(container.resolveAll(facade)).toStrictEqual([]);
  });
});

describe("a required resolve and an alias cycle still throw", () => {
  it("resolve still throws through a dangling alias", () => {
    const facade = token<string>("da:ReqFacade");
    const missing = token<string>("da:ReqMissing");
    const container = Container.create();
    container.bind(facade).toAlias(missing);

    expect(() => container.resolve(facade)).toThrow(TokenNotBoundError);
  });

  it("optional and collection reads still throw on an alias cycle", () => {
    const first = token<string>("da:CycA");
    const second = token<string>("da:CycB");
    const container = Container.create();
    container.bind(first).toAlias(second);
    container.bind(second).toAlias(first);

    expect(() => container.resolveOptional(first)).toThrow(CircularDependencyError);
    expect(() => container.resolveAll(first)).toThrow(CircularDependencyError);
  });
});
