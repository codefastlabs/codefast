/**
 * `validate()` reports a singleton graph that cannot resolve — a required dependency nothing selects, or a cycle —
 * with the error `resolve` raises for it, and leaves alone what a child container or a predicate may still settle.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { inject } from "#decorators/inject";
import { injectable } from "#decorators/injectable";
import { CircularDependencyError, NoMatchingBindingError, TokenNotBoundError } from "#errors";
import { injectAll, optional } from "#injection/descriptor";
import { whenParentIs } from "#resolution/select/constraints";

interface Logger {
  info(message: string): void;
}

const LoggerToken = token<Logger>("test:Logger");
const silentLogger: Logger = { info: () => {} };

@injectable([LoggerToken])
class Database {
  constructor(readonly logger: Logger) {}
}

@injectable([Database])
class UserRepository {
  constructor(readonly db: Database) {}
}

function caught(run: () => unknown): Error {
  try {
    run();
  } catch (error) {
    return error as Error;
  }
  throw new Error("expected the call to throw");
}

/** Validation and a real resolve fail alike: same class, same message. */
function expectSameFailure(container: Container, resolveTarget: () => unknown): Error {
  const validated = caught(() => container.validate());
  const resolved = caught(resolveTarget);
  expect(validated.constructor).toBe(resolved.constructor);
  expect(validated.message).toBe(resolved.message);
  return validated;
}

describe("container.validate() — dependencies that cannot resolve", () => {
  it("reports a required dependency nothing binds, with the path from the singleton", () => {
    const container = Container.create();
    // Validation walks singletons in registration order, so the consumer bound first is where its path starts.
    container.bind(UserRepository).toSelf().singleton();
    container.bind(Database).toSelf().singleton();

    const error = expectSameFailure(container, () => container.resolve(UserRepository));

    expect(error).toBeInstanceOf(TokenNotBoundError);
    expect((error as TokenNotBoundError).path).toEqual(["UserRepository", "Database", "test:Logger"]);
  });

  it("reports one in a toResolved() dependency list", () => {
    const Report = token<string>("test:Report");
    const container = Container.create();
    container
      .bind(Report)
      .toResolved((logger) => typeof logger, [LoggerToken])
      .singleton();

    const error = expectSameFailure(container, () => container.resolve(Report));

    expect((error as TokenNotBoundError).path).toEqual(["test:Report", "test:Logger"]);
  });

  it("reports a slot nothing declares as the NoMatchingBindingError resolve raises", () => {
    @injectable([inject(LoggerToken, { name: "audit" })])
    class AuditTrail {
      constructor(readonly logger: Logger) {}
    }
    const container = Container.create();
    container.bind(LoggerToken).toConstantValue(silentLogger);
    container.bind(AuditTrail).toSelf().singleton();

    const error = expectSameFailure(container, () => container.resolve(AuditTrail));

    expect(error).toBeInstanceOf(NoMatchingBindingError);
  });

  it("reports an alias whose target nothing binds, naming each hop", () => {
    const Target = token<Logger>("test:LoggerTarget");
    const container = Container.create();
    container.bind(LoggerToken).toAlias(Target);
    container.bind(Database).toSelf().singleton();

    const error = expectSameFailure(container, () => container.resolve(Database));

    expect((error as TokenNotBoundError).path).toEqual(["Database", "test:Logger", "test:LoggerTarget"]);
  });

  it("reports a cycle between singletons", () => {
    const BToken = token<object>("test:B");

    @injectable([BToken])
    class A {
      constructor(readonly b: object) {}
    }

    @injectable([A])
    class B {
      constructor(readonly a: A) {}
    }

    const container = Container.create();
    container.bind(A).toSelf().singleton();
    container.bind(BToken).to(B).singleton();

    const error = expectSameFailure(container, () => container.resolve(A));

    expect(error).toBeInstanceOf(CircularDependencyError);
    expect((error as CircularDependencyError).cycle).toEqual(["A", "test:B", "A"]);
  });

  it("reads a parent-owned singleton's dependencies from the parent's chain, as resolve does", () => {
    @injectable([Database])
    class RequestHandler {
      constructor(readonly db: Database) {}
    }
    const root = Container.create();
    root.bind(Database).toSelf().singleton();
    const child = root.createChild();
    // Bound on the child only, so the parent's singleton can never see it.
    child.bind(LoggerToken).toConstantValue(silentLogger);
    child.bind(RequestHandler).toSelf().singleton();

    const error = expectSameFailure(child, () => child.resolve(RequestHandler));

    expect((error as TokenNotBoundError).path).toEqual(["RequestHandler", "Database", "test:Logger"]);
  });
});

describe("container.validate() — what it leaves to resolve", () => {
  it("passes an optional dependency nothing binds, and an empty collection", () => {
    @injectable([optional(LoggerToken), injectAll(LoggerToken)])
    class Quiet {
      constructor(
        readonly logger: Logger | undefined,
        readonly all: ReadonlyArray<Logger>,
      ) {}
    }
    const container = Container.create();
    container.bind(Quiet).toSelf().singleton();

    expect(() => container.validate()).not.toThrow();
    expect(container.resolve(Quiet).all).toEqual([]);
  });

  it("passes a transient consumer whose dependency a child container supplies", () => {
    const RequestId = token<string>("test:RequestId");

    @injectable([RequestId])
    class RequestHandler {
      constructor(readonly requestId: string) {}
    }
    const root = Container.create();
    root.bind(RequestHandler).toSelf();

    expect(() => root.validate()).not.toThrow();
    const request = root.createChild();
    request.bind(RequestId).toConstantValue("req-1");
    expect(request.resolve(RequestHandler).requestId).toBe("req-1");
  });

  it("passes a request only a when() predicate can settle", () => {
    const container = Container.create();
    container.bind(LoggerToken).when(whenParentIs(Database)).toConstantValue(silentLogger);
    container.bind(Database).toSelf().singleton();

    expect(() => container.validate()).not.toThrow();
    expect(container.resolve(Database).logger).toBe(silentLogger);
  });
});
