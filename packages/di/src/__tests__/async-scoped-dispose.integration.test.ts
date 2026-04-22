import { describe, expect, it } from "vitest";
import { Container } from "#/container";
import { inject } from "#/decorators/inject";
import { injectable } from "#/decorators/injectable";
import { preDestroy } from "#/decorators/lifecycle-decorators";
import { token } from "#/token";

const DbToken = token<Database>("async-scoped-dispose-db");
const HandlerToken = token<RequestHandler>("async-scoped-dispose-handler");

let lifecycleLogSink: string[] = [];

@injectable([])
class Database {
  disconnected = false;

  @preDestroy()
  async cleanup(): Promise<void> {
    lifecycleLogSink.push("singleton:@preDestroy");
    await Promise.resolve();
    this.disconnected = true;
  }
}

@injectable([inject(DbToken)])
class RequestHandler {
  constructor(readonly db: Database) {}
}

describe("Integration: async resolve + scoped dispose + singleton lifecycle (SPEC §5 / §6)", () => {
  it("scoped handler per child, resolveAsync wiring, root dispose runs singleton onDeactivation then @preDestroy", async () => {
    const lifecycleLog: string[] = [];
    lifecycleLogSink = lifecycleLog;

    await using root = Container.create();
    root
      .bind(DbToken)
      .to(Database)
      .singleton()
      .onDeactivation(async () => {
        lifecycleLog.push("singleton:onDeactivation");
        await Promise.resolve();
      });

    root.bind(HandlerToken).to(RequestHandler).scoped();

    const child = root.createChild();
    const firstHandler = await child.resolveAsync(HandlerToken);
    await child.dispose();
    expect(lifecycleLog.some((e) => e.startsWith("singleton:"))).toBe(false);

    const sibling = root.createChild();
    const secondHandler = await sibling.resolveAsync(HandlerToken);
    expect(secondHandler).not.toBe(firstHandler);
    await sibling.dispose();

    await root.dispose();
    expect(lifecycleLog.filter((e) => e === "singleton:onDeactivation").length).toBe(1);
    expect(lifecycleLog.filter((e) => e === "singleton:@preDestroy").length).toBe(1);
    const onDeactIndex = lifecycleLog.indexOf("singleton:onDeactivation");
    const preDestroyIndex = lifecycleLog.indexOf("singleton:@preDestroy");
    expect(onDeactIndex).toBeGreaterThanOrEqual(0);
    expect(preDestroyIndex).toBeGreaterThan(onDeactIndex);
  });
});
