import { describe, expect, it, vi } from "vitest";
import { DependencyResolver } from "#/resolver";
import { ScopeManager } from "#/scope";
import { token } from "#/token";
import { createBindingIdentifier } from "#/binding";
import type { Binding, ResolutionContext } from "#/binding";
import type { MetadataReader } from "#/metadata/metadata-types";
import { AsyncResolutionError, NoMatchingBindingError, MissingMetadataError } from "#/errors";

describe("DependencyResolver", () => {
  const LoggerToken = token<string>("Logger");
  const HttpClientToken = token<string>("HttpClient");

  function mockBinding<T>(options: Partial<Binding<T>>): Binding<T> {
    const base = {
      id: createBindingIdentifier(),
      kind: "constant" as const,
      scope: "transient" as const,
      value: "val" as unknown as T,
      tags: new Map(),
    };
    return { ...base, ...options } as Binding<T>;
  }

  function setup() {
    const scopeManager = ScopeManager.createRoot();
    const lookup = vi.fn();
    const getConstructorMetadata = vi.fn();
    const metadataReader: MetadataReader = {
      getConstructorMetadata,
    };
    const resolver = new DependencyResolver({
      lookup,
      scopeManager,
      metadataReader,
    });
    return { resolver, lookup, scopeManager, metadataReader, getConstructorMetadata };
  }

  it("resolveOptionalRoot returns value if bound", () => {
    const { resolver, lookup } = setup();
    const loggerBinding = mockBinding({ value: "console-logger" });
    lookup.mockReturnValue([loggerBinding]);

    expect(resolver.resolveOptionalRoot(LoggerToken)).toBe("console-logger");
  });

  it("resolveOptionalRoot returns undefined if not bound", () => {
    const { resolver, lookup } = setup();
    lookup.mockReturnValue(undefined);

    expect(resolver.resolveOptionalRoot(LoggerToken)).toBeUndefined();
  });

  it("resolveOptionalRoot throws NoMatchingBindingError if hint doesn't match", () => {
    const { resolver, lookup } = setup();
    const loggerBinding = mockBinding({ bindingName: "console" });
    lookup.mockReturnValue([loggerBinding]);

    expect(() => resolver.resolveOptionalRoot(LoggerToken, { name: "file" })).toThrow(
      NoMatchingBindingError,
    );
  });

  it("resolveOptionalRoot throws if multiple bindings match", () => {
    const { resolver, lookup } = setup();
    lookup.mockReturnValue([mockBinding({}), mockBinding({})]);

    expect(() => resolver.resolveOptionalRoot(LoggerToken)).toThrow(/Ambiguous binding/);
  });

  it("resolveAllRoot returns empty array if not bound", () => {
    const { resolver, lookup } = setup();
    lookup.mockReturnValue([]);

    expect(resolver.resolveAllRoot(LoggerToken)).toEqual([]);
  });

  it("resolveAllRoot throws NoMatchingBindingError if hint doesn't match", () => {
    const { resolver, lookup } = setup();
    const loggerBinding = mockBinding({ bindingName: "console" });
    lookup.mockReturnValue([loggerBinding]);

    expect(() => resolver.resolveAllRoot(LoggerToken, { name: "file" })).toThrow(
      NoMatchingBindingError,
    );
  });

  it("resolveAllAsyncRoot returns values asynchronously", async () => {
    const { resolver, lookup } = setup();
    const consoleLogger = mockBinding({ value: "console" });
    const fileLogger = mockBinding<string>({
      kind: "async-dynamic",
      factory: async () => "file",
    });
    lookup.mockReturnValue([consoleLogger, fileLogger]);

    await expect(resolver.resolveAllAsyncRoot(LoggerToken)).resolves.toEqual(["console", "file"]);
  });

  it("throws AsyncResolutionError in resolveAllRoot if encountered async binding", () => {
    const { resolver, lookup } = setup();
    const asyncLogger = mockBinding<string>({
      kind: "async-dynamic",
      factory: async () => "async-log",
    });
    lookup.mockReturnValue([asyncLogger]);

    expect(() => resolver.resolveAllRoot(LoggerToken)).toThrow(AsyncResolutionError);
  });

  it("resolveOptional in ResolutionContext handles TokenNotBoundError", () => {
    const { resolver, lookup } = setup();
    const loggerBinding = mockBinding({
      kind: "dynamic",
      factory: (ctx: ResolutionContext) => ctx.resolveOptional(HttpClientToken),
    });
    // Logger is bound to a factory that optional-resolves HttpClient, but HttpClient is NOT bound
    lookup.mockImplementation((k) => (k === LoggerToken ? [loggerBinding] : undefined));

    expect(resolver.resolveRoot(LoggerToken)).toBeUndefined();
  });

  it("resolveOptional in ResolutionContext rethrows other errors", () => {
    const { resolver, lookup } = setup();
    const loggerBinding = mockBinding({
      kind: "dynamic",
      factory: (ctx: ResolutionContext) => ctx.resolveOptional(HttpClientToken),
    });
    lookup.mockImplementation((k) => {
      if (k === LoggerToken) {
        return [loggerBinding];
      }
      if (k === HttpClientToken) {
        throw new Error("Boom");
      }
      return undefined;
    });

    expect(() => resolver.resolveRoot(LoggerToken)).toThrow("Boom");
  });

  it("materialize dynamic factory returns value", () => {
    const { resolver, lookup } = setup();
    const dynamicBinding = mockBinding<string>({
      kind: "dynamic",
      factory: () => "dynamic-log-instance",
    });
    lookup.mockReturnValue([dynamicBinding]);

    expect(resolver.resolveRoot(LoggerToken)).toBe("dynamic-log-instance");
  });

  it("materialize async dynamic factory returns promise", async () => {
    const { resolver, lookup } = setup();
    const asyncLoggerBinding = mockBinding<string>({
      kind: "async-dynamic",
      factory: async () => "async-log",
    });
    lookup.mockReturnValue([asyncLoggerBinding]);

    const promise = resolver.resolveAsyncRoot(LoggerToken);
    expect(promise).toBeInstanceOf(Promise);
    expect(await promise).toBe("async-log");
  });

  it("materialize resolved factory returns value", () => {
    const { resolver, lookup } = setup();
    const logBinding = mockBinding<string>({
      kind: "resolved",
      dependencyTokens: [],
      factory: () => "resolved-log",
    });
    lookup.mockReturnValue([logBinding]);

    expect(resolver.resolveRoot(LoggerToken)).toBe("resolved-log");
  });

  it("materialize alias factory returns target value", () => {
    const { resolver, lookup } = setup();
    const clientBinding = mockBinding<string>({ kind: "constant", value: "http-client-instance" });
    const loggerAlias = mockBinding<string>({ kind: "alias", targetToken: HttpClientToken });

    lookup.mockImplementation((k) => {
      if (k === LoggerToken) {
        return [loggerAlias];
      }
      if (k === HttpClientToken) {
        return [clientBinding];
      }
      return undefined;
    });

    expect(resolver.resolveRoot(LoggerToken)).toBe("http-client-instance");
  });

  it("materialize rethrows circular dependency error with path", () => {
    const { resolver, lookup } = setup();
    const aliasBinding = mockBinding({ kind: "alias", targetToken: HttpClientToken });
    lookup.mockImplementation((k) => {
      if (k === LoggerToken) {
        return [aliasBinding];
      }
      if (k === HttpClientToken) {
        throw new Error("Boom");
      }
      return undefined;
    });

    expect(() => resolver.resolveRoot(LoggerToken)).toThrow("Boom");
  });

  it("materialize dynamic factory throws AsyncResolutionError if it returns a promise in sync mode", () => {
    const { resolver, lookup } = setup();
    const asyncDynamicBinding = mockBinding({
      kind: "dynamic",
      factory: (() => Promise.resolve("async")) as unknown as (ctx: ResolutionContext) => string,
    });
    lookup.mockReturnValue([asyncDynamicBinding]);

    expect(() => resolver.resolveRoot(LoggerToken)).toThrow(AsyncResolutionError);
  });

  it("materialize resolved factory throws AsyncResolutionError if it returns a promise in sync mode", () => {
    const { resolver, lookup } = setup();
    const asyncResolvedBinding = mockBinding({
      kind: "resolved",
      dependencyTokens: [],
      factory: (() => Promise.resolve("async")) as unknown as (...args: unknown[]) => string,
    });
    lookup.mockReturnValue([asyncResolvedBinding]);

    expect(() => resolver.resolveRoot(LoggerToken)).toThrow(AsyncResolutionError);
  });

  it("instantiateClassBinding handles optional parameters", () => {
    const { resolver, lookup, getConstructorMetadata } = setup();
    class PaymentProcessor {
      constructor(public client?: string) {}
    }
    const processorBinding = mockBinding<PaymentProcessor>({
      kind: "class",
      implementationClass: PaymentProcessor,
    });

    vi.mocked(getConstructorMetadata).mockReturnValue({
      params: [{ index: 0, token: HttpClientToken, optional: true }],
    });

    lookup.mockImplementation((k) => {
      if (k === PaymentProcessor) {
        return [processorBinding];
      }
      return undefined; // HttpClientToken is not bound
    });

    const instance = resolver.resolveRoot(PaymentProcessor) as PaymentProcessor;
    expect(instance).toBeInstanceOf(PaymentProcessor);
    expect(instance.client).toBeUndefined();
  });

  it("instantiateClassBindingAsync handles optional parameters with missing binding", async () => {
    const { resolver, lookup, getConstructorMetadata } = setup();
    class AsyncPaymentProcessor {
      constructor(public client?: string) {}
    }
    const processorBinding = mockBinding<AsyncPaymentProcessor>({
      kind: "class",
      implementationClass: AsyncPaymentProcessor,
    });

    vi.mocked(getConstructorMetadata).mockReturnValue({
      params: [{ index: 0, token: HttpClientToken, optional: true }],
    });

    lookup.mockImplementation((k) => {
      if (k === AsyncPaymentProcessor) {
        return [processorBinding];
      }
      return undefined; // HttpClientToken is not bound
    });

    const instance = (await resolver.resolveAsyncRoot(
      AsyncPaymentProcessor,
    )) as AsyncPaymentProcessor;
    expect(instance).toBeInstanceOf(AsyncPaymentProcessor);
    expect(instance.client).toBeUndefined();
  });

  it("instantiateClassBindingAsync rethrows other errors in optional params", async () => {
    const { resolver, lookup, getConstructorMetadata } = setup();
    class AsyncPaymentProcessor {
      constructor(public client?: string) {}
    }
    const processorBinding = mockBinding<AsyncPaymentProcessor>({
      kind: "class",
      implementationClass: AsyncPaymentProcessor,
    });

    vi.mocked(getConstructorMetadata).mockReturnValue({
      params: [{ index: 0, token: HttpClientToken, optional: true }],
    });

    lookup.mockImplementation((k) => {
      if (k === AsyncPaymentProcessor) {
        return [processorBinding];
      }
      if (k === HttpClientToken) {
        throw new Error("Failure");
      }
      return undefined;
    });

    await expect(resolver.resolveAsyncRoot(AsyncPaymentProcessor)).rejects.toThrow("Failure");
  });

  it("instantiateClassBinding rethrows other errors in optional params", () => {
    const { resolver, lookup, getConstructorMetadata } = setup();
    class PaymentProcessor {
      constructor(public client?: string) {}
    }
    const processorBinding = mockBinding<PaymentProcessor>({
      kind: "class",
      implementationClass: PaymentProcessor,
    });

    vi.mocked(getConstructorMetadata).mockReturnValue({
      params: [{ index: 0, token: HttpClientToken, optional: true }],
    });

    lookup.mockImplementation((k) => {
      if (k === PaymentProcessor) {
        return [processorBinding];
      }
      if (k === HttpClientToken) {
        throw new Error("Unexpected");
      }
      return undefined;
    });

    expect(() => resolver.resolveRoot(PaymentProcessor)).toThrow("Unexpected");
  });

  it("instantiateClassBinding throws MissingMetadataError if arity > 0 and no meta", () => {
    const { resolver, lookup, getConstructorMetadata } = setup();
    class UnmarkedService {
      constructor(_dep: string) {
        // _dep is unused
      }
    }
    const serviceBinding = mockBinding<UnmarkedService>({
      kind: "class",
      implementationClass: UnmarkedService,
    });

    vi.mocked(getConstructorMetadata).mockReturnValue(undefined);
    lookup.mockReturnValue([serviceBinding]);

    expect(() => resolver.resolveRoot(UnmarkedService)).toThrow(MissingMetadataError);
  });

  it("instantiateClassBinding handles classes with no parameters", () => {
    const { resolver, lookup, getConstructorMetadata } = setup();
    class NoOpService {}
    const serviceBinding = mockBinding<NoOpService>({
      kind: "class",
      implementationClass: NoOpService,
    });
    lookup.mockReturnValue([serviceBinding]);
    vi.mocked(getConstructorMetadata).mockReturnValue({
      params: [],
    });

    expect(resolver.resolveRoot(NoOpService)).toBeInstanceOf(NoOpService);
  });

  it("instantiateClassBinding handles undefined metadata reader", () => {
    class BasicService {}
    const serviceBinding = mockBinding<BasicService>({
      kind: "class",
      implementationClass: BasicService,
    });
    const lookup = vi.fn().mockReturnValue([serviceBinding]);
    const resolver = new DependencyResolver({
      lookup,
      scopeManager: ScopeManager.createRoot(),
      metadataReader: undefined as unknown as MetadataReader,
    });

    expect(resolver.resolveRoot(BasicService)).toBeInstanceOf(BasicService);
  });

  it("instantiateClassBindingAsync throws MissingMetadataError if arity > 0 and no meta", async () => {
    const { resolver, lookup, getConstructorMetadata } = setup();
    class AsyncDatabase {
      constructor(_dep: string) {
        // _dep is unused
      }
    }
    const databaseBinding = mockBinding<AsyncDatabase>({
      kind: "class",
      implementationClass: AsyncDatabase,
    });

    vi.mocked(getConstructorMetadata).mockReturnValue(undefined);
    lookup.mockReturnValue([databaseBinding]);

    await expect(resolver.resolveAsyncRoot(AsyncDatabase)).rejects.toThrow(MissingMetadataError);
  });

  it("instantiateClassBindingAsync handles classes with no parameters", async () => {
    const { resolver, lookup, getConstructorMetadata } = setup();
    class AsyncNoOp {}
    const noOpBinding = mockBinding<AsyncNoOp>({ kind: "class", implementationClass: AsyncNoOp });
    lookup.mockReturnValue([noOpBinding]);
    vi.mocked(getConstructorMetadata).mockReturnValue({
      params: [],
    });

    expect(await resolver.resolveAsyncRoot(AsyncNoOp)).toBeInstanceOf(AsyncNoOp);
  });
});
