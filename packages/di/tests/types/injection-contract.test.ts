import { describe, expect, it } from "vitest";

import { Container } from "#/container/container";
import { token } from "#/core/token";
import { injectable } from "#/decorators/injectable";
import { injectAll, optional } from "#/injection/descriptor";

interface Logger {
  log: () => void;
}
interface Config {
  port: number;
}

const LoggerToken = token<Logger>("Logger");
const ConfigToken = token<Config>("Config");

/**
 * What a factory and a constructor are promised, and what they are actually handed.
 *
 * The rejections live in a function nothing calls: a decorator runs at class-definition time, and
 * `@ts-expect-error` silences the compiler rather than the runtime. The compiler checks every line
 * regardless, and reports an unused directive the moment one stops erroring.
 */
const rejectedDeclarations = (): void => {
  const container = Container.create();

  container.bind(token<string>("multi-lies")).toResolved(
    // @ts-expect-error — `multi` hands the factory an array, not one Logger
    (logger: Logger) => (logger.log(), "x"),
    [{ multi: true, optional: false, token: LoggerToken }],
  );

  container.bind(token<string>("optional-lies")).toResolved(
    // @ts-expect-error — `optional` can hand the factory undefined
    (logger: Logger) => (logger.log(), "x"),
    [{ multi: false, optional: true, token: LoggerToken }],
  );

  // @ts-expect-error — the deps are declared in the opposite order to the constructor
  @injectable([ConfigToken, LoggerToken])
  class Swapped {
    constructor(
      readonly logger: Logger,
      readonly config: Config,
    ) {}
  }

  // @ts-expect-error — one dependency short of the constructor
  @injectable([LoggerToken])
  class TooFew {
    constructor(
      readonly logger: Logger,
      readonly config: Config,
    ) {}
  }

  // @ts-expect-error — `injectAll` hands the constructor an array, not one Logger
  @injectable([injectAll(LoggerToken)])
  class WrongMulti {
    constructor(readonly logger: Logger) {}
  }

  // @ts-expect-error — `optional` can hand the constructor undefined
  @injectable([optional(ConfigToken)])
  class WrongOptional {
    constructor(readonly config: Config) {}
  }

  // @ts-expect-error — one dependency more than the constructor takes
  @injectable([LoggerToken, ConfigToken])
  class Surplus {
    constructor(readonly logger: Logger) {}
  }

  void [Swapped, TooFew, WrongMulti, WrongOptional, Surplus];
};

// Arity admits what the constructor admits: an optional trailing parameter and a rest parameter
// both compile, so the exact-arity rule rejects only a surplus the class could never receive.
@injectable([LoggerToken, ConfigToken])
class TrailingOptional {
  constructor(
    readonly logger: Logger,
    readonly config?: Config,
  ) {}
}

@injectable([LoggerToken, ConfigToken])
class RestParameters {
  constructor(...args: Array<unknown>) {
    void args;
  }
}

void [TrailingOptional, RestParameters];

describe("injection declarations are checked against what receives them", () => {
  it("holds the rejections above to the compiler, never to the runtime", () => {
    expect(rejectedDeclarations).toBeTypeOf("function");
  });

  it("keeps a matching declaration compiling, and resolving", () => {
    const container = Container.create();
    const logger: Logger = { log: () => undefined };

    container.bind(LoggerToken).toConstantValue(logger);
    container.bind(ConfigToken).toConstantValue({ port: 3000 });

    const Described = token<string>("described");

    container
      .bind(Described)
      .toResolved(
        (all: Array<Logger>, config: Config | undefined) => `${String(all.length)}:${String(config?.port)}`,
        [injectAll(LoggerToken), optional(ConfigToken)],
      );

    expect(container.resolve(Described)).toBe("1:3000");
  });
});
