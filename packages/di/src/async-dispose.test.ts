import { describe, expect, it } from "vitest";
import { Container, token } from "#/index";

describe("Container Symbol.asyncDispose (spec §5.5)", () => {
  it("runs onDeactivation via await using", async () => {
    const connectionToken = token<{ closed: boolean }>("async-dispose-connection");
    let deactivationCallCount = 0;

    const connectionInstance = { closed: false };

    {
      await using container = Container.create();
      container
        .bind(connectionToken)
        .toConstantValue(connectionInstance)
        .onDeactivation((instance) => {
          deactivationCallCount += 1;
          instance.closed = true;
        });
      expect(container.resolve(connectionToken)).toBe(connectionInstance);
    }

    expect(deactivationCallCount).toBe(1);
    expect(connectionInstance.closed).toBe(true);
  });

  it("dispose() and [Symbol.asyncDispose]() run the same teardown path", async () => {
    const connectionToken = token<{ closed: boolean }>("async-dispose-parity");
    const disposedViaMethod = { closed: false };
    const disposedViaSymbol = { closed: false };

    const methodContainer = Container.create();
    methodContainer
      .bind(connectionToken)
      .toConstantValue(disposedViaMethod)
      .onDeactivation((instance) => {
        instance.closed = true;
      });
    methodContainer.resolve(connectionToken);
    await methodContainer.dispose();

    const symbolContainer = Container.create();
    symbolContainer
      .bind(connectionToken)
      .toConstantValue(disposedViaSymbol)
      .onDeactivation((instance) => {
        instance.closed = true;
      });
    symbolContainer.resolve(connectionToken);
    await symbolContainer[Symbol.asyncDispose]();

    expect(disposedViaMethod.closed).toBe(true);
    expect(disposedViaSymbol.closed).toBe(true);
  });
});
