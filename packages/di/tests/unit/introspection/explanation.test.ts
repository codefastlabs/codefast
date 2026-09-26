/**
 * `explain()` names the rule that settled a request, the candidates it weighed and where the lookup went, and each
 * case checks its answer against what `resolve` does with the same request.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { tag } from "#core/tag";
import { token } from "#core/token";
import {
  AmbiguousBindingError,
  CircularDependencyError,
  DisposedContainerError,
  NoMatchingBindingError,
  TokenNotBoundError,
} from "#errors/errors";
import { whenParentIs } from "#resolution/select/constraints";

const REGION = tag("explain:region");
const TIER = tag("explain:tier");

describe("the rule that settles a registry", () => {
  it("names a lone eligible candidate", () => {
    const serviceToken = token<string>("explain:Lone");
    const container = Container.create();
    const id = container.bind(serviceToken).toConstantValue("lone").id();

    const explanation = container.explain(serviceToken);

    expect(explanation.outcome).toBe("selected");
    expect(explanation.selected?.id).toBe(id);
    expect(explanation.steps).toHaveLength(1);
    expect(explanation.steps[0]).toMatchObject({ tokenName: "explain:Lone", depth: 0, rule: "sole-candidate" });
    expect(explanation.steps[0]?.candidates.map((candidate) => candidate.verdict)).toStrictEqual(["eligible"]);
    expect(container.resolve(serviceToken)).toBe("lone");
  });

  it("marks a slot the request does not match and selects the one it does", () => {
    const serviceToken = token<string, "file">("explain:Named");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("default");
    const namedId = container.bind(serviceToken).toConstantValue("file").whenNamed("file").id();

    const explanation = container.explain(serviceToken, { name: "file" });

    expect(explanation.selected?.id).toBe(namedId);
    expect(explanation.steps[0]?.candidates.map((candidate) => candidate.verdict)).toStrictEqual([
      "slot-mismatch",
      "eligible",
    ]);
    expect(container.resolve(serviceToken, { name: "file" })).toBe("file");
  });

  it("lets the only candidate carrying a predicate beat the ones without", () => {
    const serviceToken = token<string>("explain:Predicate");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("plain");
    const guardedId = container
      .bind(serviceToken)
      .toConstantValue("guarded")
      .when(() => true)
      .id();

    const explanation = container.explain(serviceToken);

    expect(explanation.steps[0]?.rule).toBe("sole-predicate");
    expect(explanation.selected?.id).toBe(guardedId);
    expect(container.resolve(serviceToken)).toBe("guarded");
  });

  it("reports a predicate that refused and settles on what is left", () => {
    const serviceToken = token<string>("explain:Refused");
    const container = Container.create();
    const plainId = container.bind(serviceToken).toConstantValue("plain").id();
    container
      .bind(serviceToken)
      .toConstantValue("guarded")
      .when(() => false);

    const explanation = container.explain(serviceToken);

    expect(explanation.steps[0]?.candidates.map((candidate) => candidate.verdict)).toStrictEqual([
      "eligible",
      "predicate-refused",
    ]);
    expect(explanation.steps[0]?.rule).toBe("sole-candidate");
    expect(explanation.selected?.id).toBe(plainId);
    expect(container.resolve(serviceToken)).toBe("plain");
  });

  it("prefers the slot declaring more of what the request carries", () => {
    const serviceToken = token<string>("explain:Specific");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue("region").whenTagged(REGION.of("eu"));
    const specificId = container
      .bind(serviceToken)
      .toConstantValue("region-and-tier")
      .whenTagged(REGION.of("eu"))
      .whenTagged(TIER.of("gold"))
      .id();
    const request = { tags: [REGION.of("eu"), TIER.of("gold")] };

    const explanation = container.explain(serviceToken, request);

    expect(explanation.steps[0]?.rule).toBe("most-criteria");
    expect(explanation.selected?.id).toBe(specificId);
    expect(container.resolve(serviceToken, request)).toBe("region-and-tier");
  });

  it("reports a tie as ambiguous, where resolve throws", () => {
    const serviceToken = token<string>("explain:Tie");
    const container = Container.create();
    container
      .bind(serviceToken)
      .toConstantValue("first")
      .when(() => true);
    container
      .bind(serviceToken)
      .toConstantValue("second")
      .when(() => true);

    const explanation = container.explain(serviceToken);

    expect(explanation.outcome).toBe("ambiguous");
    expect(explanation.steps[0]?.rule).toBe("ambiguous");
    expect(explanation.selected).toBeUndefined();
    expect(() => container.resolve(serviceToken)).toThrow(AmbiguousBindingError);
  });
});

describe("where the lookup goes", () => {
  it("reads the parent when the child holds nothing for the token", () => {
    const serviceToken = token<string>("explain:Inherited");
    const parent = Container.create();
    const id = parent.bind(serviceToken).toConstantValue("parent").id();
    const child = parent.createChild();

    const explanation = child.explain(serviceToken);

    expect(explanation.steps.map((step) => step.depth)).toStrictEqual([1]);
    expect(explanation.selected?.id).toBe(id);
    expect(child.resolve(serviceToken)).toBe("parent");
  });

  it("moves up past a registry whose candidates are all out", () => {
    const serviceToken = token<string, "file">("explain:Shadow");
    const parent = Container.create();
    const parentId = parent.bind(serviceToken).toConstantValue("parent").whenNamed("file").id();
    const child = parent.createChild();
    child.bind(serviceToken).toConstantValue("child");

    const explanation = child.explain(serviceToken, { name: "file" });

    expect(explanation.steps.map((step) => [step.depth, step.rule])).toStrictEqual([
      [0, undefined],
      [1, "sole-candidate"],
    ]);
    expect(explanation.selected?.id).toBe(parentId);
    expect(child.resolve(serviceToken, { name: "file" })).toBe("parent");
  });

  it("follows a default-slot alias that forwards the request's criteria", () => {
    const facade = token<string, "replica">("explain:Facade");
    const store = token<string, "replica">("explain:Store");
    const container = Container.create();
    container.bind(facade).toAlias(store);
    const replicaId = container.bind(store).toConstantValue("replica").whenNamed("replica").id();

    const explanation = container.explain(facade, { name: "replica" });

    expect(explanation.steps.map((step) => [step.tokenName, step.rule])).toStrictEqual([
      ["explain:Facade", "default-alias"],
      ["explain:Store", "sole-candidate"],
    ]);
    expect(explanation.selected?.id).toBe(replicaId);
    expect(container.resolve(facade, { name: "replica" })).toBe("replica");
  });

  it("stops on an alias cycle, where resolve throws", () => {
    const first = token<string>("explain:CycleFirst");
    const second = token<string>("explain:CycleSecond");
    const container = Container.create();
    container.bind(first).toAlias(second);
    container.bind(second).toAlias(first);

    expect(container.explain(first).outcome).toBe("alias-cycle");
    expect(() => container.resolve(first)).toThrow(CircularDependencyError);
  });
});

describe("a request that selects nothing", () => {
  it("is unbound when no registry in the chain holds the token", () => {
    const serviceToken = token<string>("explain:Unbound");
    const container = Container.create().createChild();

    const explanation = container.explain(serviceToken);

    expect(explanation).toStrictEqual({
      tokenName: "explain:Unbound",
      steps: [],
      selected: undefined,
      outcome: "unbound",
    });
    expect(() => container.resolve(serviceToken)).toThrow(TokenNotBoundError);
  });

  it("is unmatched when bindings exist and none is eligible", () => {
    const serviceToken = token<number>("explain:Members");
    const container = Container.create();
    container.bind(serviceToken).toConstantValue(1).many();

    const explanation = container.explain(serviceToken);

    expect(explanation.outcome).toBe("unmatched");
    expect(explanation.steps[0]?.candidates.map((candidate) => candidate.verdict)).toStrictEqual(["collection-member"]);
    expect(() => container.resolve(serviceToken)).toThrow(NoMatchingBindingError);
  });
});

describe("a request nested in other resolutions", () => {
  const settlement = token<{ readonly audit: string }>("explain:Settlement");
  const audit = token<string>("explain:Audit");

  function auditContainer(): Container {
    const container = Container.create();
    container.bind(audit).toConstantValue("general");
    container.bind(audit).toConstantValue("settlement").when(whenParentIs(settlement));
    container.bind(settlement).toResolved((logger) => ({ audit: logger }), [audit]);
    return container;
  }

  it("shows a parent predicate the way the parent's factory meets it", () => {
    const container = auditContainer();

    const nested = container.explain(audit, { ancestors: [settlement] });
    const topLevel = container.explain(audit);

    expect(nested.steps[0]?.rule).toBe("sole-predicate");
    expect(topLevel.steps[0]?.candidates.map((candidate) => candidate.verdict)).toStrictEqual([
      "eligible",
      "predicate-refused",
    ]);
    expect(container.resolve(settlement).audit).toBe("settlement");
    expect(container.resolve(audit)).toBe("general");
  });

  it("throws what resolve would for an ancestor that selects nothing", () => {
    const container = auditContainer();

    expect(() => container.explain(audit, { ancestors: [token<object>("explain:Missing")] })).toThrow(
      TokenNotBoundError,
    );
  });
});

describe("explain() as a read", () => {
  it("instantiates nothing", () => {
    const serviceToken = token<object>("explain:Lazy");
    let constructed = 0;
    const container = Container.create();
    container
      .bind(serviceToken)
      .toDynamic(() => {
        constructed += 1;
        return {};
      })
      .singleton();

    container.explain(serviceToken);

    expect(constructed).toBe(0);
  });

  it("refuses a disposed container like every other read", async () => {
    const container = Container.create();
    await container.dispose();

    expect(() => container.explain(token<string>("explain:Disposed"))).toThrow(DisposedContainerError);
  });
});
