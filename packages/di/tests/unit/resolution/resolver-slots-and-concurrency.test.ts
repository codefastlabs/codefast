/**
 * Slot-matching rules and the concurrent/async resolution branches.
 *
 * Slot matching is symmetric: a constrained binding only matches a request that carries the
 * matching constraint, and an unconstrained binding is excluded once the request asks for a
 * name or tags. The concurrency cases exercise the resolver's non-owner context branch, which
 * only runs when a second async chain starts while another still owns the shared context.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { injectable } from "#/decorators/injectable";
import { postConstruct } from "#/decorators/lifecycle-decorators";
import { CircularDependencyError } from "#/errors";
import { token } from "#/token";

describe("multi-tag slot matching", () => {
  const serviceToken = token<string>("multi-tag-service");

  function container(): ReturnType<typeof Container.create> {
    const instance = Container.create();
    instance.bind(serviceToken).toConstantValue("both").whenTagged("env", "prod").whenTagged("region", "eu");
    return instance;
  }

  it("matches only when every tag the binding declares is requested", () => {
    const resolved = container().resolve(serviceToken, {
      tags: [
        ["env", "prod"],
        ["region", "eu"],
      ],
    });
    expect(resolved).toBe("both");
  });

  it("does not match when only part of the binding's tags are requested", () => {
    expect(container().resolveOptional(serviceToken, { tags: [["env", "prod"]] })).toBeUndefined();
  });

  it("does not match when a tag value differs", () => {
    expect(
      container().resolveOptional(serviceToken, {
        tags: [
          ["env", "prod"],
          ["region", "us"],
        ],
      }),
    ).toBeUndefined();
  });

  it("excludes an unconstrained binding once tags are requested", () => {
    const plain = Container.create();
    plain.bind(serviceToken).toConstantValue("plain");

    expect(plain.resolve(serviceToken)).toBe("plain");
    expect(plain.resolveOptional(serviceToken, { tag: ["env", "prod"] })).toBeUndefined();
  });

  it("excludes a name-only binding when the request also carries tags", () => {
    const named = Container.create();
    named.bind(serviceToken).toConstantValue("named").whenNamed("primary");

    expect(named.resolve(serviceToken, { name: "primary" })).toBe("named");
    expect(named.resolveOptional(serviceToken, { name: "primary", tag: ["env", "prod"] })).toBeUndefined();
  });
});

describe("toResolved dependency tokens", () => {
  it("resolves each declared dependency token in order", () => {
    const hostToken = token<string>("resolved-host");
    const portToken = token<number>("resolved-port");
    const urlToken = token<string>("resolved-url");

    const container = Container.create();
    container.bind(hostToken).toConstantValue("example.test");
    container.bind(portToken).toConstantValue(8080);
    container
      .bind(urlToken)
      .toResolved((host, port) => `https://${String(host)}:${String(port)}`, [hostToken, portToken])
      .singleton();

    expect(container.resolve(urlToken)).toBe("https://example.test:8080");
  });

  it("re-reads its dependencies for a transient toResolved binding", () => {
    const counterToken = token<number>("resolved-counter");
    const derivedToken = token<number>("resolved-derived");

    let next = 0;
    const container = Container.create();
    container
      .bind(counterToken)
      .toDynamic(() => ++next)
      .transient();
    container
      .bind(derivedToken)
      .toResolved((count) => Number(count) * 10, [counterToken])
      .transient();

    expect(container.resolve(derivedToken)).toBe(10);
    expect(container.resolve(derivedToken)).toBe(20);
  });
});

describe("async resolution branches", () => {
  it("resolves independent chains concurrently without crossing state", async () => {
    const slowToken = token<string>("concurrent-slow");
    const fastToken = token<string>("concurrent-fast");
    const sharedLeaf = token<string>("concurrent-leaf");

    const container = Container.create();
    container
      .bind(sharedLeaf)
      .toDynamicAsync(async () => {
        await Promise.resolve();
        return "leaf";
      })
      .transient();
    container
      .bind(slowToken)
      .toDynamicAsync(async (ctx) => {
        await Promise.resolve();
        return `slow:${await ctx.resolveAsync(sharedLeaf)}`;
      })
      .transient();
    container
      .bind(fastToken)
      .toDynamicAsync(async (ctx) => `fast:${await ctx.resolveAsync(sharedLeaf)}`)
      .transient();

    // Both roots start before either settles, so the second one runs as a non-owner chain.
    const [slow, fast] = await Promise.all([container.resolveAsync(slowToken), container.resolveAsync(fastToken)]);

    expect(slow).toBe("slow:leaf");
    expect(fast).toBe("fast:leaf");
  });

  it("rejects an async cycle rather than hanging", async () => {
    const firstToken = token<string>("async-cycle-a");
    const secondToken = token<string>("async-cycle-b");

    const container = Container.create();
    container
      .bind(firstToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(secondToken))
      .transient();
    container
      .bind(secondToken)
      .toDynamicAsync(async (ctx) => ctx.resolveAsync(firstToken))
      .transient();

    await expect(container.resolveAsync(firstToken)).rejects.toBeInstanceOf(CircularDependencyError);
  });

  it("awaits @postConstruct when a class is built asynchronously", async () => {
    const configToken = token<string>("post-construct-config");
    const serviceToken = token<{ ready: boolean }>("post-construct-service");

    @injectable([configToken])
    class Service {
      ready = false;

      constructor(readonly config: string) {}

      @postConstruct()
      async warm(): Promise<void> {
        await Promise.resolve();
        this.ready = true;
      }
    }

    const container = Container.create();
    container
      .bind(configToken)
      .toDynamicAsync(async () => Promise.resolve("cfg"))
      .singleton();
    container.bind(serviceToken).to(Service).singleton();

    const service = await container.resolveAsync(serviceToken);

    expect(service.ready).toBe(true);
  });

  it("resolveOptionalAsync yields undefined for a missing binding", async () => {
    const container = Container.create();
    await expect(container.resolveOptionalAsync(token<string>("async-missing"))).resolves.toBeUndefined();
  });
});
