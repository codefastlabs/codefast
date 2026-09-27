import { Container, tag, token } from "#index";

interface Engine {
  readonly id: string;
}

const FUEL = tag<string>("fuel");
const SIZE = tag<string>("size");
const TURBO = tag<boolean>("turbo");
const PETROL = "petrol";
const V8 = "v8";

function buildGeneralAndSpecialised(): { container: Container; engineToken: ReturnType<typeof token<Engine>> } {
  const engineToken = token<Engine>("engine");
  const container = Container.create();

  container.bind(engineToken).whenTagged(FUEL.of(PETROL)).toConstantValue({ id: "petrol" });
  container.bind(engineToken).whenTagged(FUEL.of(PETROL)).whenTagged(SIZE.of(V8)).toConstantValue({ id: "turbo-v8" });

  return { container, engineToken };
}

describe("tag-count specificity", () => {
  it("an over-specified request takes the slot declaring more of it", () => {
    const { container, engineToken } = buildGeneralAndSpecialised();

    expect(
      container.resolve(engineToken, {
        tags: [FUEL.of(PETROL), SIZE.of(V8)],
      }).id,
    ).toBe("turbo-v8");
  });

  it("leaves the general slot answering a request that names only its tag", () => {
    const { container, engineToken } = buildGeneralAndSpecialised();

    expect(container.resolve(engineToken, { tags: [FUEL.of(PETROL)] }).id).toBe("petrol");
  });

  it("answers the shorthand's one-tag question with the general slot", () => {
    const { container, engineToken } = buildGeneralAndSpecialised();

    // The shorthand carries one tag, so this asks the general question and must get the general answer.
    expect(container.resolve(engineToken, { tag: FUEL.of(PETROL) }).id).toBe("petrol");
  });

  it("keeps resolveAll returning every match, specificity being a single-selection rule", () => {
    const { container, engineToken } = buildGeneralAndSpecialised();

    const all = container.resolveAll(engineToken, {
      tags: [FUEL.of(PETROL), SIZE.of(V8)],
    });

    expect(all.map((engine) => engine.id).toSorted()).toStrictEqual(["petrol", "turbo-v8"]);
  });

  it("stays ambiguous when two candidates declare the same number of tags", () => {
    const engineToken = token<Engine>("engine");
    const container = Container.create();

    container.bind(engineToken).whenTagged(FUEL.of(PETROL)).toConstantValue({ id: "by-fuel" });
    container.bind(engineToken).whenTagged(SIZE.of(V8)).toConstantValue({ id: "by-size" });

    expect(() =>
      container.resolve(engineToken, {
        tags: [FUEL.of(PETROL), SIZE.of(V8)],
      }),
    ).toThrow(/without a clear winner/);
  });

  it("picks the most specific of three, and the middle one when the deepest cannot apply", () => {
    const engineToken = token<Engine>("engine");
    const container = Container.create();

    container.bind(engineToken).whenTagged(FUEL.of(PETROL)).toConstantValue({ id: "one" });
    container.bind(engineToken).whenTagged(FUEL.of(PETROL)).whenTagged(SIZE.of(V8)).toConstantValue({ id: "two" });
    container
      .bind(engineToken)
      .whenTagged(FUEL.of(PETROL))
      .whenTagged(SIZE.of(V8))
      .whenTagged(TURBO.of(true))
      .toConstantValue({ id: "three" });

    expect(
      container.resolve(engineToken, {
        tags: [FUEL.of(PETROL), SIZE.of(V8), TURBO.of(true)],
      }).id,
    ).toBe("three");
    expect(
      container.resolve(engineToken, {
        tags: [FUEL.of(PETROL), SIZE.of(V8)],
      }).id,
    ).toBe("two");
  });

  it("still lets a lone predicate decide, which is the older rule", () => {
    const engineToken = token<Engine>("engine");
    const container = Container.create();

    // The predicate sits on the *less* specific slot: predicate order is first, so it wins.
    container
      .bind(engineToken)
      .whenTagged(FUEL.of(PETROL))
      .when(() => true)
      .toConstantValue({ id: "guarded-general" });
    container.bind(engineToken).whenTagged(FUEL.of(PETROL)).whenTagged(SIZE.of(V8)).toConstantValue({ id: "turbo-v8" });

    expect(
      container.resolve(engineToken, {
        tags: [FUEL.of(PETROL), SIZE.of(V8)],
      }).id,
    ).toBe("guarded-general");
  });

  it("leaves two predicates on the default slot ambiguous", () => {
    const engineToken = token<Engine>("engine");
    const container = Container.create();

    container
      .bind(engineToken)
      .when(() => true)
      .toDynamic(() => ({ id: "first" }));
    container
      .bind(engineToken)
      .when(() => true)
      .toDynamic(() => ({ id: "second" }));

    expect(() => container.resolve(engineToken)).toThrow(/without a clear winner/);
  });
});
