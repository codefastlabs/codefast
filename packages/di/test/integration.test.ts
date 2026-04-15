import { describe, expect, it, vi } from "vitest";
import {
  AsyncModule,
  AsyncResolutionError,
  Container,
  decoratorMetadataObjectSymbol,
  inject,
  injectable,
  Module,
  SymbolMetadataReader,
  token,
} from "#lib/index";

// --- Domain types & tokens

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

// --- User service (constructor injection via Symbol.metadata)

@injectable()
class UserService {
  static {
    inject.param(UserService, 0, LoggerToken);
    inject.param(UserService, 1, DatabaseToken);
  }

  constructor(
    readonly logger: Logger,
    readonly database: Database,
  ) {}

  greet(): string {
    this.logger.log("greet");
    return `${this.database.connectionId}:ok`;
  }
}

const metadataReader = new SymbolMetadataReader();

describe("@codefast/di integration (database & app)", () => {
  it("loads async infra then sync app, resolves UserService, enforces sync/async rules, dispose, child last-wins, and Symbol.metadata", async () => {
    expect(
      Reflect.getOwnPropertyDescriptor(UserService, decoratorMetadataObjectSymbol()),
    ).toBeDefined();
    expect(metadataReader.getConstructorMetadata(UserService)).toEqual({
      parameters: [
        { optional: false, token: LoggerToken },
        { optional: false, token: DatabaseToken },
      ],
    });

    let deactivationCallCount = 0;

    const InfraModule = AsyncModule.createAsync("infra", async (api) => {
      await Promise.resolve();

      api
        .bind(ConfigToken)
        .toConstantValue({ databaseUrl: "postgresql://integration:5432/app" })
        .build();

      api
        .bind(LoggerToken)
        .toDynamic(() => new ConsoleLogger())
        .singleton()
        .build();

      api
        .bind(DatabaseToken)
        .toAsyncDynamic(async (ctx) => {
          const config = ctx.resolve(ConfigToken);
          return new Database(config.databaseUrl);
        })
        .singleton()
        .onActivation((_ctx, instance) => {
          instance.activate();
        })
        .onDeactivation((_ctx, instance) => {
          deactivationCallCount += 1;
          instance.disconnect();
        })
        .build();
    });

    // Sync app module: bindings only. Infra is an AsyncModule, so it cannot be referenced from
    // Module.import(); load order via fromModulesAsync(InfraModule, AppModule) provides the graph.
    const AppModule = Module.create("app", (api) => {
      api.bind(UserService).toSelf().singleton().build();
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
    const childLogger: Logger = { log: vi.fn<(message: string) => void>() };
    child.bind(LoggerToken).toConstantValue(childLogger).build();

    expect(child.resolve(LoggerToken)).toBe(childLogger);
    expect(container.resolve(LoggerToken)).toBe(rootLogger);

    const userViaChild = await child.resolveAsync(UserService);
    expect(userViaChild).toBe(user);
    expect(userViaChild.logger).toBe(rootLogger);

    container.dispose();
    expect(deactivationCallCount).toBe(1);
    expect(user.database.disconnected).toBe(true);
  });
});
