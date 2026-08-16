/**
 * The multi-tag lane: a name-less multi-tag resolve selects over the union of the two tag indexes,
 * and every answer the full selection path gave — subsets, specificity, predicates, chains — holds.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { tag } from "#/core/tag";
import { token } from "#/core/token";
import { AmbiguousBindingError } from "#/errors/errors";

const ENV = tag<string>("mt-select-env");
const TIER = tag<string>("mt-select-tier");
const REGION = tag<string>("mt-select-region");

describe("multi-tag selection over the tag indexes", () => {
  it("answers a request from single-tag and multi-tag subsets, most specific winning", () => {
    const service = token<string>("mt.subsets");
    const container = Container.create();
    container.bind(service).toConstantValue("env-only").whenTagged(ENV.of("prod"));
    container.bind(service).toConstantValue("tier-only").whenTagged(TIER.of("premium"));
    container.bind(service).toConstantValue("both").whenTagged(ENV.of("prod")).whenTagged(TIER.of("premium"));

    // resolve: [env], [tier] and [env,tier] all match — two tags beat one.
    expect(container.resolve(service, { tags: [ENV.of("prod"), TIER.of("premium")] })).toBe("both");
    // resolveAll keeps the full path: every subset answers.
    const all = container.resolveAll(service, { tags: [ENV.of("prod"), TIER.of("premium")] });
    expect([...all].sort()).toEqual(["both", "env-only", "tier-only"]);
  });

  it("finds a binding whichever tag its slot declared first", () => {
    const service = token<string>("mt.first-tag-order");
    const container = Container.create();
    // Slot tags [tier, env] — bucketed under the tier criterion.
    container.bind(service).toConstantValue("tier-first").whenTagged(TIER.of("premium")).whenTagged(ENV.of("prod"));

    expect(container.resolve(service, { tags: [ENV.of("prod"), TIER.of("premium")] })).toBe("tier-first");
  });

  it("matches a two-tag slot against a wider request, as a subset", () => {
    const service = token<string>("mt.wider-request");
    const container = Container.create();
    container.bind(service).toConstantValue("subset").whenTagged(ENV.of("prod")).whenTagged(TIER.of("premium"));

    expect(container.resolve(service, { tags: [ENV.of("prod"), TIER.of("premium"), REGION.of("eu")] })).toBe("subset");
  });

  it("still evaluates a multi-tag binding's predicate", () => {
    const service = token<string>("mt.predicate");
    const container = Container.create();
    container
      .bind(service)
      .toConstantValue("refused")
      .whenTagged(ENV.of("prod"))
      .whenTagged(TIER.of("premium"))
      .when(() => false);
    container.bind(service).toConstantValue("fallback").whenTagged(ENV.of("prod"));

    expect(container.resolve(service, { tags: [ENV.of("prod"), TIER.of("premium")] })).toBe("fallback");
  });

  it("reports ambiguity when two one-tag subsets tie", () => {
    const service = token<string>("mt.ambiguity");
    const container = Container.create();
    container.bind(service).toConstantValue("env-only").whenTagged(ENV.of("prod"));
    container.bind(service).toConstantValue("tier-only").whenTagged(TIER.of("premium"));

    expect(() => container.resolve(service, { tags: [ENV.of("prod"), TIER.of("premium")] })).toThrow(
      AmbiguousBindingError,
    );
  });

  it("keeps the index in step with unbind and rebind", () => {
    const service = token<string>("mt.rebind");
    const container = Container.create();
    const staleId = container
      .bind(service)
      .toConstantValue("stale")
      .whenTagged(ENV.of("prod"))
      .whenTagged(TIER.of("premium"))
      .id();
    const request = { tags: [ENV.of("prod"), TIER.of("premium")] };

    expect(container.resolve(service, request)).toBe("stale");
    container.unbind(staleId);
    expect(() => container.resolve(service, request)).toThrow("No binding");

    container.bind(service).toConstantValue("fresh").whenTagged(ENV.of("prod")).whenTagged(TIER.of("premium"));
    expect(container.resolve(service, request)).toBe("fresh");
  });

  it("resolves a parent-owned multi-tag binding from a child", () => {
    const service = token<string>("mt.chain");
    const parent = Container.create();
    parent.bind(service).toConstantValue("parent-owned").whenTagged(ENV.of("prod")).whenTagged(TIER.of("premium"));
    const child = parent.createChild();

    expect(child.resolve(service, { tags: [ENV.of("prod"), TIER.of("premium")] })).toBe("parent-owned");
  });

  it("does not double-count a criterion repeated across the two request spellings", () => {
    const service = token<string>("mt.duplicate-criterion");
    const container = Container.create();
    container.bind(service).toConstantValue("only").whenTagged(ENV.of("prod"));

    // tag + tags both carry the env pair; a doubled candidate would read as ambiguous.
    expect(container.resolve(service, { tag: ENV.of("prod"), tags: [ENV.of("prod")] })).toBe("only");
  });

  it("leaves a name-plus-tags request on the full selection path", () => {
    const service = token<string>("mt.named-and-tagged");
    const container = Container.create();
    container
      .bind(service)
      .toConstantValue("named-tagged")
      .whenNamed("primary")
      .whenTagged(ENV.of("prod"))
      .whenTagged(TIER.of("premium"));

    expect(container.resolve(service, { name: "primary", tags: [ENV.of("prod"), TIER.of("premium")] })).toBe(
      "named-tagged",
    );
  });
});
