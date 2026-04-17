import { describe, expect, it } from "vitest";
import { Container, inject, injectable, token } from "#/index";

describe("Symbol tag keys (spec §4.4)", () => {
  it("matches bindings by unique symbol identity, not description", () => {
    const engineToken = token<string>("sym-tag-engine");
    const firstFuelTag = Symbol("fuel");
    const secondFuelTag = Symbol("fuel");

    const container = Container.create();
    container.bind(engineToken).whenTagged(firstFuelTag, "petrol").toConstantValue("first-engine");
    container
      .bind(engineToken)
      .whenTagged(secondFuelTag, "petrol")
      .toConstantValue("second-engine");

    expect(container.resolve(engineToken, { tag: [firstFuelTag, "petrol"] })).toBe("first-engine");
    expect(container.resolve(engineToken, { tag: [secondFuelTag, "petrol"] })).toBe(
      "second-engine",
    );
  });

  it("supports Symbol.for registered keys (cross-realm safe)", () => {
    const globalFuelTag = Symbol.for("codefast.di.test.fuel");
    const engineToken = token<string>("sym-tag-engine-global");

    const container = Container.create();
    container.bind(engineToken).whenTagged(globalFuelTag, "diesel").toConstantValue("diesel-impl");
    expect(container.resolve(engineToken, { tag: [globalFuelTag, "diesel"] })).toBe("diesel-impl");
  });

  it("works through @inject({ tag }) decorator path", () => {
    const engineToken = token<string>("sym-tag-engine-dec");
    const fuelTag = Symbol.for("codefast.di.test.fuel.dec");

    const container = Container.create();
    container.bind(engineToken).whenTagged(fuelTag, "electric").toConstantValue("electric-engine");

    @injectable([inject(engineToken, { tag: [fuelTag, "electric"] })])
    class Car {
      constructor(readonly engine: string) {}
    }

    container.bind(Car).toSelf();
    expect(container.resolve(Car).engine).toBe("electric-engine");
  });

  it("renders Symbol tags in dependency graph JSON without throwing (inspector is symbol-safe)", () => {
    const engineToken = token<string>("sym-tag-graph");
    const globalFuelTag = Symbol.for("codefast.di.test.fuel.graph");
    const localFuelTag = Symbol("local-fuel");

    const container = Container.create();
    container.bind(engineToken).whenTagged(globalFuelTag, "diesel").toConstantValue("diesel");
    container.bind(engineToken).whenTagged(localFuelTag, "petrol").toConstantValue("petrol");

    const graphJson = container.generateDependencyGraphJson();
    expect(() => {
      JSON.parse(graphJson);
    }).not.toThrow();
  });
});
