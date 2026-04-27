import {
  isCliTelemetryEnabled,
  withCliPortTelemetry,
  withOptionalPortTelemetry,
} from "#/lib/core/infrastructure/port-telemetry.decorator";

describe("port telemetry decorator integration", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    delete process.env.ENABLE_TELEMETRY;
  });

  it("logs sync call timing and summarized args", () => {
    const logger = { out: vi.fn(), err: vi.fn() };
    const circular: Record<string, unknown> = {};
    circular.self = circular;
    const port = {
      ping: (...payload: unknown[]) => payload,
      version: "1.0.0",
    };

    const wrapped = withCliPortTelemetry({
      portName: "demoPort",
      implementation: port,
      logger,
    });
    const result = wrapped.ping("x".repeat(300), 42, true, null, undefined, { ok: 1 }, circular);

    expect(result).toHaveLength(7);
    expect(wrapped.version).toBe("1.0.0");
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("[telemetry:demoPort.ping] ←"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("…(300 chars)"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("[object]"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("→"));
  });

  it("logs async ok and async err branches", async () => {
    const logger = { out: vi.fn(), err: vi.fn() };
    const wrapped = withCliPortTelemetry({
      portName: "asyncPort",
      implementation: {
        okAsync: async () => "ok",
        failAsync: async () => {
          throw new Error("async-fail");
        },
      },
      logger,
    });

    await expect(wrapped.okAsync()).resolves.toBe("ok");
    await expect(wrapped.failAsync()).rejects.toThrow("async-fail");
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("asyncPort.okAsync"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("asyncPort.failAsync"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("→ ok"));
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("→ err"));
  });

  it("logs sync throw branch", () => {
    const logger = { out: vi.fn(), err: vi.fn() };
    const wrapped = withCliPortTelemetry({
      portName: "syncPort",
      implementation: {
        explode: () => {
          throw new Error("sync-fail");
        },
      },
      logger,
    });

    expect(() => wrapped.explode()).toThrow("sync-fail");
    expect(logger.out).toHaveBeenCalledWith(expect.stringContaining("→ err"));
  });

  it("enables optional telemetry only when env flag is on", () => {
    const logger = { out: vi.fn(), err: vi.fn() };
    const impl = { run: () => "ok" };

    process.env.ENABLE_TELEMETRY = "false";
    const disabled = withOptionalPortTelemetry("optional", impl, logger);
    expect(disabled).toBe(impl);

    process.env.ENABLE_TELEMETRY = "true";
    const enabled = withOptionalPortTelemetry("optional", impl, logger);
    expect(enabled).not.toBe(impl);
    expect(enabled.run()).toBe("ok");
    expect(logger.out).toHaveBeenCalled();
  });

  it("detects telemetry env variants", () => {
    process.env.ENABLE_TELEMETRY = "1";
    expect(isCliTelemetryEnabled()).toBe(true);
    process.env.ENABLE_TELEMETRY = "true";
    expect(isCliTelemetryEnabled()).toBe(true);
    process.env.ENABLE_TELEMETRY = "0";
    expect(isCliTelemetryEnabled()).toBe(false);
  });
});
