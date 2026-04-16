import { describe, expect, it } from "vitest";
import { Container } from "#container";
import { ScopeViolationError } from "#errors";
import { token } from "#token";
import { injectable } from "#decorators/injectable";
import { scoped } from "#decorators/scoped";
import { singleton } from "#decorators/singleton";

class Ephemeral {
  readonly tag = "ephemeral";
}

const TShort = token<Ephemeral>("ShortLived");
const TLong = token<string>("LongLived");

describe("ScopeValidation", () => {
  it("throws from validate() when a singleton binding statically depends on a transient binding", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .transient();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton();

    expect(() => {
      container.validate();
    }).toThrow(ScopeViolationError);
  });

  it("throws during resolve when a singleton captures a transient dependency", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .transient();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton();

    expect(() => {
      container.resolve(TLong);
    }).toThrow(ScopeViolationError);
  });

  it("allows singleton depending on another singleton", () => {
    const container = Container.create();
    container
      .bind(TShort)
      .toDynamic(() => new Ephemeral())
      .singleton();
    container
      .bind(TLong)
      .toResolved((shortLived) => `holds:${shortLived.tag}`, [TShort])
      .singleton();
    container.validate();
    expect(container.resolve(TLong)).toBe("holds:ephemeral");
  });

  it("allows singleton depending on a constant binding", () => {
    const TConfig = token<string>("Config");
    const container = Container.create();
    container.bind(TConfig).toConstantValue("x");
    container
      .bind(TLong)
      .toResolved((config) => `holds:${config}`, [TConfig])
      .singleton();
    container.validate();
    expect(container.resolve(TLong)).toBe("holds:x");
  });

  it("throws when singleton class depends on scoped class", () => {
    @scoped()
    @injectable()
    class UserContext {}

    @singleton()
    @injectable([UserContext])
    class DatabaseService {
      constructor(readonly userContext: UserContext) {}
    }

    const container = Container.create();
    container.bind(UserContext).toSelf();
    container.bind(DatabaseService).toSelf();

    expect(() => {
      container.resolve(DatabaseService);
    }).toThrow(ScopeViolationError);
    expect(() => {
      container.resolve(DatabaseService);
    }).toThrow(/Singleton "DatabaseService" cannot depend on Scoped "UserContext"/);
  });

  it("allows scoped class depending on singleton class", () => {
    @singleton()
    @injectable()
    class DatabaseService {}

    @scoped()
    @injectable([DatabaseService])
    class UserContext {
      constructor(readonly databaseService: DatabaseService) {}
    }

    const container = Container.create();
    container.bind(DatabaseService).toSelf();
    container.bind(UserContext).toSelf();

    const resolved = container.resolve(UserContext);
    expect(resolved.databaseService).toBeInstanceOf(DatabaseService);
  });

  it("allows transient class depending on scoped class", () => {
    @scoped()
    @injectable()
    class UserContext {}

    @injectable([UserContext])
    class AuditTrailService {
      constructor(readonly userContext: UserContext) {}
    }

    const container = Container.create();
    container.bind(UserContext).toSelf();
    container.bind(AuditTrailService).toSelf().transient();

    const resolved = container.resolve(AuditTrailService);
    expect(resolved.userContext).toBeInstanceOf(UserContext);
  });
});
