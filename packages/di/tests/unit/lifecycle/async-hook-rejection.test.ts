/**
 * A lifecycle hook reached from a synchronous lane has already run by the time the sync-lane error
 * is raised, so its promise must be adopted — a rejecting async hook cannot become an unhandled
 * rejection that ends the process.
 */
import { describe, expect, it } from "vitest";

import { Container } from "#container/container";
import { token } from "#core/token";
import { injectable } from "#decorators/injectable";
import { postConstruct, preDestroy } from "#decorators/lifecycle-decorators";
import { AsyncActivationError, AsyncDeactivationError } from "#errors/errors";

/** Runs a synchronous operation, returning what it threw and any promise rejection left unhandled. */
async function runCollectingRejections(run: () => void): Promise<{ thrown: unknown; rejections: Array<unknown> }> {
  const rejections: Array<unknown> = [];
  const onRejection = (reason: unknown): void => {
    rejections.push(reason);
  };
  process.on("unhandledRejection", onRejection);
  let thrown: unknown;
  try {
    run();
  } catch (error) {
    thrown = error;
  }
  // Flush microtasks and a macrotask so an orphaned rejection would have surfaced.
  await new Promise((resolve) => setTimeout(resolve, 10));
  process.off("unhandledRejection", onRejection);
  return { thrown, rejections };
}

describe("an async activation hook reached from a sync resolve", () => {
  it("adopts a rejected @postConstruct", async () => {
    const service = token<object>("ah:postConstruct");

    @injectable([])
    class Service {
      @postConstruct()
      init(): Promise<void> {
        return Promise.reject(new Error("boom"));
      }
    }
    const container = Container.create();
    container.bind(service).to(Service).transient();

    const { thrown, rejections } = await runCollectingRejections(() => container.resolve(service));
    expect(thrown).toBeInstanceOf(AsyncActivationError);
    expect(rejections).toStrictEqual([]);
  });

  it("adopts a rejected per-binding onActivation", async () => {
    const service = token<string>("ah:onActivation");
    const container = Container.create();
    container
      .bind(service)
      .toConstantValue("v")
      .onActivation(() => Promise.reject(new Error("boom")));

    const { thrown, rejections } = await runCollectingRejections(() => container.resolve(service));
    expect(thrown).toBeInstanceOf(AsyncActivationError);
    expect(rejections).toStrictEqual([]);
  });

  it("adopts a rejected container-level onActivation", async () => {
    const service = token<string>("ah:containerActivation");
    const container = Container.create();
    container.bind(service).toConstantValue("v");
    container.onActivation(service, () => Promise.reject(new Error("boom")));

    const { thrown, rejections } = await runCollectingRejections(() => container.resolve(service));
    expect(thrown).toBeInstanceOf(AsyncActivationError);
    expect(rejections).toStrictEqual([]);
  });
});

describe("an async deactivation hook reached from a sync unbind", () => {
  it("adopts a rejected container-level onDeactivation", async () => {
    const service = token<string>("ah:containerDeactivation");
    const container = Container.create();
    container.bind(service).toConstantValue("v");
    container.onDeactivation(service, () => Promise.reject(new Error("boom")));
    container.resolve(service);

    const { thrown, rejections } = await runCollectingRejections(() => container.unbind(service));
    expect(thrown).toBeInstanceOf(AsyncDeactivationError);
    expect(rejections).toStrictEqual([]);
  });

  it("adopts a rejected per-binding onDeactivation", async () => {
    const service = token<string>("ah:bindingDeactivation");
    const container = Container.create();
    container
      .bind(service)
      .toConstantValue("v")
      .onDeactivation(() => Promise.reject(new Error("boom")));
    container.resolve(service);

    const { thrown, rejections } = await runCollectingRejections(() => container.unbind(service));
    expect(thrown).toBeInstanceOf(AsyncDeactivationError);
    expect(rejections).toStrictEqual([]);
  });

  it("adopts a rejected @preDestroy", async () => {
    const service = token<object>("ah:preDestroy");

    @injectable([])
    class Service {
      @preDestroy()
      close(): Promise<void> {
        return Promise.reject(new Error("boom"));
      }
    }
    const container = Container.create();
    container.bind(service).to(Service).singleton();
    container.resolve(service);

    const { thrown, rejections } = await runCollectingRejections(() => container.unbind(service));
    expect(thrown).toBeInstanceOf(AsyncDeactivationError);
    expect(rejections).toStrictEqual([]);
  });
});
