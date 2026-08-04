import { Container, token } from "#/index";

interface Engine {
  readonly id: string;
}

const FUEL = "fuel";
const SIZE = "size";
const PETROL = "petrol";
const V8 = "v8";

function buildGeneralAndSpecialised(): { container: Container; engineToken: ReturnType<typeof token<Engine>> } {
  const engineToken = token<Engine>("engine");
  const container = Container.create();

  container.bind(engineToken).toConstantValue({ id: "petrol" }).whenTagged(FUEL, PETROL);
  container.bind(engineToken).toConstantValue({ id: "turbo-v8" }).whenTagged(FUEL, PETROL).whenTagged(SIZE, V8);

  return { container, engineToken };
}

describe("tag-count specificity", () => {
  it("an over-specified request takes the slot declaring more of it", () => {
    const { container, engineToken } = buildGeneralAndSpecialised();

    expect(
      container.resolve(engineToken, {
        tags: [
          [FUEL, PETROL],
          [SIZE, V8],
        ],
      }).id,
    ).toBe("turbo-v8");
  });

  it("leaves the general slot answering a request that names only its tag", () => {
    const { container, engineToken } = buildGeneralAndSpecialised();

    expect(container.resolve(engineToken, { tags: [[FUEL, PETROL]] }).id).toBe("petrol");
  });

  it("answers the shorthand's one-tag question with the general slot", () => {
    const { container, engineToken } = buildGeneralAndSpecialised();

    // The shorthand carries one tag, so this asks the general question and must get the general answer.
    expect(container.resolve(engineToken, { tag: [FUEL, PETROL] }).id).toBe("petrol");
  });

  it("keeps resolveAll returning every match, specificity being a single-selection rule", () => {
    const { container, engineToken } = buildGeneralAndSpecialised();

    const all = container.resolveAll(engineToken, {
      tags: [
        [FUEL, PETROL],
        [SIZE, V8],
      ],
    });

    expect(all.map((engine) => engine.id).toSorted()).toStrictEqual(["petrol", "turbo-v8"]);
  });

  it("stays ambiguous when two candidates declare the same number of tags", () => {
    const engineToken = token<Engine>("engine");
    const container = Container.create();

    container.bind(engineToken).toConstantValue({ id: "by-fuel" }).whenTagged(FUEL, PETROL);
    container.bind(engineToken).toConstantValue({ id: "by-size" }).whenTagged(SIZE, V8);

    expect(() =>
      container.resolve(engineToken, {
        tags: [
          [FUEL, PETROL],
          [SIZE, V8],
        ],
      }),
    ).toThrow(/without a clear winner/);
  });

  it("picks the most specific of three, and the middle one when the deepest cannot apply", () => {
    const engineToken = token<Engine>("engine");
    const container = Container.create();

    container.bind(engineToken).toConstantValue({ id: "one" }).whenTagged(FUEL, PETROL);
    container.bind(engineToken).toConstantValue({ id: "two" }).whenTagged(FUEL, PETROL).whenTagged(SIZE, V8);
    container
      .bind(engineToken)
      .toConstantValue({ id: "three" })
      .whenTagged(FUEL, PETROL)
      .whenTagged(SIZE, V8)
      .whenTagged("turbo", true);

    expect(
      container.resolve(engineToken, {
        tags: [
          [FUEL, PETROL],
          [SIZE, V8],
          ["turbo", true],
        ],
      }).id,
    ).toBe("three");
    expect(
      container.resolve(engineToken, {
        tags: [
          [FUEL, PETROL],
          [SIZE, V8],
        ],
      }).id,
    ).toBe("two");
  });

  it("still lets a lone predicate decide, which is the older rule", () => {
    const engineToken = token<Engine>("engine");
    const container = Container.create();

    // The predicate sits on the *less* specific slot: predicate order is first, so it wins.
    container
      .bind(engineToken)
      .toConstantValue({ id: "guarded-general" })
      .whenTagged(FUEL, PETROL)
      .when(() => true);
    container.bind(engineToken).toConstantValue({ id: "turbo-v8" }).whenTagged(FUEL, PETROL).whenTagged(SIZE, V8);

    expect(
      container.resolve(engineToken, {
        tags: [
          [FUEL, PETROL],
          [SIZE, V8],
        ],
      }).id,
    ).toBe("guarded-general");
  });

  it("leaves two predicates on the default slot ambiguous", () => {
    const engineToken = token<Engine>("engine");
    const container = Container.create();

    container
      .bind(engineToken)
      .toDynamic(() => ({ id: "first" }))
      .when(() => true);
    container
      .bind(engineToken)
      .toDynamic(() => ({ id: "second" }))
      .when(() => true);

    expect(() => container.resolve(engineToken)).toThrow(/without a clear winner/);
  });
});
