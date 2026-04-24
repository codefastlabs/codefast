import { describe, it, expect } from "vitest";
import {
  Container,
  token,
  injectable,
  inject,
  Module,
  AsyncModule,
  TokenNotBoundError,
} from "#/index";

describe("@codefast/di public exports", () => {
  it("performs a complete DI lifecycle using public exports", () => {
    const ApiKeyToken = token<string>("ApiKey");

    @injectable([inject(ApiKeyToken)])
    class PaymentGateway {
      constructor(public apiKey: string) {}
    }

    const container = Container.create();
    container.bind(ApiKeyToken).toConstantValue("sk_test_123");
    container.bind(PaymentGateway).toSelf().singleton();

    const gateway = container.resolve(PaymentGateway);
    expect(gateway).toBeInstanceOf(PaymentGateway);
    expect(gateway.apiKey).toBe("sk_test_123");

    // Verify singleton scope works
    const secondGateway = container.resolve(PaymentGateway);
    expect(secondGateway).toBe(gateway);
  });

  it("exports and uses modules correctly", () => {
    const ConfigurationToken = token<number>("Config");
    const ConfigurationModule = Module.create("ConfigModule", (api) => {
      api.bind(ConfigurationToken).toConstantValue(42);
    });

    const container = Container.create();
    container.load(ConfigurationModule);

    expect(container.resolve(ConfigurationToken)).toBe(42);
  });

  it("exports and uses async modules correctly", async () => {
    const DatabaseToken = token<string>("Database");
    const DatabaseModule = Module.createAsync("DatabaseModule", async (api) => {
      await Promise.resolve();
      api.bind(DatabaseToken).toConstantValue("postgres://localhost");
    });

    const container = Container.create();
    await container.loadAsync(DatabaseModule);

    expect(container.resolve(DatabaseToken)).toBe("postgres://localhost");
  });

  it("exports and throws core error classes", () => {
    const container = Container.create();
    const unknownToken = token("UnknownService");

    expect(() => container.resolve(unknownToken)).toThrow(TokenNotBoundError);
    expect(() => container.resolve(unknownToken)).toThrow(/Token not bound: UnknownService/);
  });

  it("verifies secondary exports are available", () => {
    expect(Container).toBeDefined();
    expect(Module).toBeDefined();
    expect(token).toBeDefined();
    expect(inject).toBeDefined();
    expect(injectable).toBeDefined();
    expect(AsyncModule).toBeDefined();
  });
});
