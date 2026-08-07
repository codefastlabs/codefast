/**
 * Compiled-plan shapes that the escape tests don't reach: the specialized constructor arities,
 * the `toResolved` plan's bail-outs, and the retry that fires when a dependency's lifecycle
 * metadata is not known yet. Plans only compile after one warm resolve, so every case warms
 * first and then asserts on the compiled resolve.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { injectable } from "#/decorators/injectable";

const WARM_ITERATIONS = 5;

function warm(resolveOnce: () => unknown): void {
  for (let index = 0; index < WARM_ITERATIONS; index += 1) {
    resolveOnce();
  }
}

describe("compiled plan constructor arities", () => {
  // The compiler emits a hand-written closure per arity up to three and a spread beyond, so each
  // one is a separate code path that has to produce the same instance.
  it.each([1, 2, 3, 4, 5])("passes %i dependencies in order", (arity) => {
    const depTokens = Array.from({ length: arity }, (_value, index) =>
      token<number>(`plan-arity-${String(arity)}-${String(index)}`),
    );

    @injectable(depTokens)
    class Root {
      readonly received: Array<number>;

      constructor(...deps: Array<number>) {
        this.received = deps;
      }
    }

    const container = Container.create();
    for (const [index, depToken] of depTokens.entries()) {
      container.bind(depToken).toConstantValue(index * 10);
    }
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));

    expect(container.resolve(Root).received).toEqual(depTokens.map((_value, index) => index * 10));
  });
});

describe("activation need for non-class bindings", () => {
  it("honours a container-level hook on a binding that has none of its own", () => {
    const greetingToken = token<string>("container-hook-dynamic");
    const container = Container.create();
    // Singleton, so the resolve goes through the general binding path rather than the
    // transient-dynamic fast lane, which dispatches on the hooks directly.
    container
      .bind(greetingToken)
      .toDynamic(() => "hello")
      .singleton();
    container.onActivation(greetingToken, (_ctx, value: string) => `${value}!`);

    warm(() => container.resolve(greetingToken));

    expect(container.resolve(greetingToken)).toBe("hello!");
  });
});

describe("toResolved plans", () => {
  it("compiles a resolved factory with its declared deps", () => {
    const leftToken = token<number>("resolved-left");
    const rightToken = token<number>("resolved-right");
    const sumToken = token<number>("resolved-sum");

    const container = Container.create();
    container.bind(leftToken).toConstantValue(2);
    container.bind(rightToken).toConstantValue(3);
    container.bind(sumToken).toResolved((left: number, right: number) => left + right, [leftToken, rightToken]);

    warm(() => container.resolve(sumToken));

    expect(container.resolve(sumToken)).toBe(5);
  });

  it("keeps the runtime path when the resolved binding carries an activation hook", () => {
    const baseToken = token<number>("resolved-activated-base");
    const valueToken = token<number>("resolved-activated");

    const container = Container.create();
    container.bind(baseToken).toConstantValue(4);
    container
      .bind(valueToken)
      .toResolved((base: number) => base, [baseToken])
      .transient()
      .onActivation((_ctx, value) => value * 2);

    warm(() => container.resolve(valueToken));

    expect(container.resolve(valueToken)).toBe(8);
  });

  it("still resolves when a declared dep cannot be inlined", () => {
    const dynamicToken = token<number>("resolved-dynamic-dep");
    const valueToken = token<number>("resolved-with-dynamic-dep");
    let factoryCalls = 0;

    const container = Container.create();
    container.bind(dynamicToken).toDynamic(() => {
      factoryCalls += 1;
      return 6;
    });
    container.bind(valueToken).toResolved((dep: number) => dep + 1, [dynamicToken]);

    warm(() => container.resolve(valueToken));
    factoryCalls = 0;

    expect(container.resolve(valueToken)).toBe(7);
    expect(factoryCalls).toBe(1);
  });
});

describe("plan compilation retries", () => {
  it("recompiles a class plan after a dependency's lifecycle metadata becomes known", () => {
    const depToken = token<{ label: string }>("plan-retry-dep");

    @injectable()
    class FirstDep {
      readonly label = "first";
    }

    @injectable()
    class SecondDep {
      readonly label = "second";
    }

    @injectable([depToken])
    class Root {
      constructor(readonly dep: { label: string }) {}
    }

    const container = Container.create();
    container.bind(depToken).to(FirstDep).transient();
    container.bind(Root).toSelf().transient();

    warm(() => container.resolve(Root));
    expect(container.resolve(Root).dep.label).toBe("first");

    // SecondDep has never been instantiated, so its post-construct presence is still unknown
    // when the plan recompiles — the dep-level retry path.
    container.rebind(depToken).to(SecondDep).transient();

    expect(container.resolve(Root).dep.label).toBe("second");
    warm(() => container.resolve(Root));
    expect(container.resolve(Root).dep.label).toBe("second");
  });

  it("recompiles a toResolved plan the same way", () => {
    const depToken = token<{ label: string }>("plan-retry-resolved-dep");
    const valueToken = token<string>("plan-retry-resolved");

    @injectable()
    class FirstDep {
      readonly label = "first";
    }

    @injectable()
    class SecondDep {
      readonly label = "second";
    }

    const container = Container.create();
    container.bind(depToken).to(FirstDep).transient();
    container.bind(valueToken).toResolved((dep: { label: string }) => dep.label, [depToken]);

    warm(() => container.resolve(valueToken));
    expect(container.resolve(valueToken)).toBe("first");

    container.rebind(depToken).to(SecondDep).transient();

    expect(container.resolve(valueToken)).toBe("second");
    warm(() => container.resolve(valueToken));
    expect(container.resolve(valueToken)).toBe("second");
  });
});
