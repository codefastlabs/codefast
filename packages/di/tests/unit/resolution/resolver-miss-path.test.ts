import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { inject } from "#decorators/inject";
import { injectable } from "#decorators/injectable";
import { NoMatchingBindingError, TokenNotBoundError } from "#errors";
import { PLAN_CODEGEN_THRESHOLD } from "#resolution/plan/codegen";

interface Logger {
  info(message: string): void;
}

const Config = token<{ url: string }>("test:Config");
const LoggerToken = token<Logger>("test:Logger");

@injectable([Config, LoggerToken])
class Database {
  constructor(
    readonly config: { url: string },
    readonly logger: Logger,
  ) {}
}

@injectable([Database])
class UserRepository {
  constructor(readonly db: Database) {}
}

@injectable([UserRepository, LoggerToken])
class UserService {
  constructor(
    readonly repository: UserRepository,
    readonly logger: Logger,
  ) {}
}

const CHAIN = ["UserService", "UserRepository", "Database", "test:Logger"];

function chainContainer(databaseScope: "singleton" | "transient"): Container {
  const container = Container.create();
  container.bind(Config).toConstantValue({ url: "memory://" });
  const database = container.bind(Database).toSelf();
  if (databaseScope === "singleton") {
    database.singleton();
  } else {
    database.transient();
  }
  container.bind(UserRepository).toSelf();
  container.bind(UserService).toSelf();
  return container;
}

function caught(run: () => unknown): unknown {
  try {
    run();
  } catch (error) {
    return error;
  }
  throw new Error("expected the call to throw");
}

describe("the path a missing-binding error names", () => {
  it("is the token alone for a top-level miss, and the message carries no path", () => {
    const error = caught(() => Container.create().resolve(LoggerToken));

    expect(error).toBeInstanceOf(TokenNotBoundError);
    expect((error as TokenNotBoundError).path).toEqual(["test:Logger"]);
    expect((error as TokenNotBoundError).message).toBe(
      "No binding found for token 'test:Logger'. Did you forget container.bind(test:Logger)?",
    );
  });

  it.each(["singleton", "transient"] as const)("runs from the request to the miss with a %s dependency", (scope) => {
    const error = caught(() => chainContainer(scope).resolve(UserService));

    expect(error).toBeInstanceOf(TokenNotBoundError);
    expect((error as TokenNotBoundError).path).toEqual(CHAIN);
    expect((error as TokenNotBoundError).message).toContain(
      "Path: UserService → UserRepository → Database → test:Logger",
    );
  });

  it("is the same on the async lane", async () => {
    const error = await chainContainer("transient")
      .resolveAsync(UserService)
      .catch((rejection: unknown) => rejection);

    expect(error).toBeInstanceOf(TokenNotBoundError);
    expect((error as TokenNotBoundError).path).toEqual(CHAIN);
  });

  it("is the same once the plan is generated, for a dependency unbound afterwards", () => {
    const container = chainContainer("transient");
    container.bind(LoggerToken).toConstantValue({ info: () => {} });
    for (let run = 0; run <= PLAN_CODEGEN_THRESHOLD + 1; run += 1) {
      container.resolve(UserService);
    }
    container.unbind(LoggerToken);

    const error = caught(() => container.resolve(UserService));

    expect((error as TokenNotBoundError).path).toEqual(CHAIN);
  });

  it("starts at a factory that resolves the chain inside its body", () => {
    const Report = token<string>("test:Report");
    const container = chainContainer("transient");
    container.bind(Report).toDynamic((ctx) => ctx.resolve(UserService).constructor.name);

    const error = caught(() => container.resolve(Report));

    expect((error as TokenNotBoundError).path).toEqual(["test:Report", ...CHAIN]);
  });

  it("names every alias hop up to the token nothing binds", () => {
    const Target = token<Logger>("test:LoggerTarget");
    const container = chainContainer("transient");
    container.bind(LoggerToken).toAlias(Target);

    const error = caught(() => container.resolve(UserService));

    expect(error).toBeInstanceOf(TokenNotBoundError);
    expect((error as TokenNotBoundError).tokenName).toBe("test:LoggerTarget");
    expect((error as TokenNotBoundError).path).toEqual([...CHAIN, "test:LoggerTarget"]);
  });

  it("is named on a slot that matches nothing, too", () => {
    @injectable([inject(LoggerToken, { name: "audit" })])
    class AuditTrail {
      constructor(readonly logger: Logger) {}
    }
    const Trail = token<AuditTrail>("test:Trail");
    const container = Container.create();
    container.bind(LoggerToken).toConstantValue({ info: () => {} });
    container.bind(Trail).to(AuditTrail);

    const error = caught(() => container.resolve(Trail));

    expect(error).toBeInstanceOf(NoMatchingBindingError);
    expect((error as NoMatchingBindingError).path).toEqual(["test:Trail", "test:Logger"]);
    expect((error as NoMatchingBindingError).message).toContain("Path: test:Trail → test:Logger");
  });

  it("runs from explain()'s ancestors to the one that selects nothing", () => {
    const Missing = token<unknown>("test:Missing");
    const container = chainContainer("transient");

    const error = caught(() => container.explain(LoggerToken, { ancestors: [UserService, Missing] }));

    expect(error).toBeInstanceOf(TokenNotBoundError);
    expect((error as TokenNotBoundError).path).toEqual(["UserService", "test:Missing"]);
  });
});
