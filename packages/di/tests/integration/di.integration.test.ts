import { describe, expect, it, vi } from "vitest";
import { AsyncResolutionError, Container, inject, injectable, Module, token } from "#/index";
type AppConfig = {
  readonly databaseUrl: string;
};
interface Logger {
  readonly log: (message: string) => void;
}
class ConsoleLogger implements Logger {
  readonly lines: string[] = [];
  log(message: string): void {
    this.lines.push(message);
  }
}
class Database {
  readonly connectionId: string;
  disconnected = false;
  private activated = false;
  constructor(url: string) {
    this.connectionId = `db:${url}`;
  }
  get isActivated(): boolean {
    return this.activated;
  }
  activate(): void {
    this.activated = true;
  }
  disconnect(): void {
    this.disconnected = true;
  }
}
const ConfigToken = token<AppConfig>("Config");
const LoggerToken = token<Logger>("Logger");
const DatabaseToken = token<Database>("Database");
@injectable([inject(LoggerToken), inject(DatabaseToken)])
class UserService {
  constructor(
    readonly logger: Logger,
    readonly database: Database,
  ) {}
  greet(): string {
    this.logger.log("greet");
    return `${this.database.connectionId}:ok`;
  }
}
describe("Integration: Application Lifecycle", () => {
  it("loads async infra then sync app, resolves UserService, enforces sync/async rules, dispose, child last-wins, and Symbol.metadata", async () => {
    let deactivationCallCount = 0;
    const InfraModule = Module.createAsync("infra", async (api) => {
      await Promise.resolve();
      api.bind(ConfigToken).toConstantValue({ databaseUrl: "postgresql://integration:5432/app" });
      api
        .bind(LoggerToken)
        .toDynamic(() => new ConsoleLogger())
        .singleton();
      api
        .bind(DatabaseToken)
        .toDynamicAsync(async (ctx) => {
          const config = ctx.resolve(ConfigToken);
          return new Database(config.databaseUrl);
        })
        .singleton()
        .onActivation((_ctx, instance) => {
          instance.activate();
          return instance;
        })
        .onDeactivation((instance) => {
          deactivationCallCount += 1;
          instance.disconnect();
        });
    });
    const AppModule = Module.create("app", (api) => {
      api.bind(UserService).toSelf().singleton();
    });
    const container = await Container.fromModulesAsync(InfraModule, AppModule);
    container.validate();
    expect(() => {
      container.resolve(DatabaseToken);
    }).toThrow(AsyncResolutionError);
    const user = await container.resolveAsync(UserService);
    expect(user.database.isActivated).toBe(true);
    expect(user.greet()).toBe("db:postgresql://integration:5432/app:ok");
    const secondUser = await container.resolveAsync(UserService);
    expect(secondUser).toBe(user);
    expect(secondUser.database).toBe(user.database);
    const rootLogger = container.resolve(LoggerToken);
    const child = container.createChild();
    const childLogger: Logger = { log: vi.fn() };
    child.bind(LoggerToken).toConstantValue(childLogger);
    expect(child.resolve(LoggerToken)).toBe(childLogger);
    expect(container.resolve(LoggerToken)).toBe(rootLogger);
    const userViaChild = await child.resolveAsync(UserService);
    expect(userViaChild).toBe(user);
    expect(userViaChild.logger).toBe(rootLogger);
    await container.dispose();
    expect(deactivationCallCount).toBe(1);
    expect(user.database.disconnected).toBe(true);
  });
});
