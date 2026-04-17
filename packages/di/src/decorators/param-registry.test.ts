import { describe, expect, it } from "vitest";
import { getOrCreatePendingMap, takePendingMap } from "#/decorators/param-registry";
import { token } from "#/token";

describe("param-registry", () => {
  it("getOrCreatePendingMap creates a new map when one does not exist", () => {
    class TestController {}
    const map = getOrCreatePendingMap(TestController);
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBe(0);
  });

  it("getOrCreatePendingMap returns the exact same map on subsequent calls", () => {
    class TestController {}
    class OtherController {}

    const firstMap = getOrCreatePendingMap(TestController);
    firstMap.set(0, { index: 0, token: token<string>("dep"), optional: false });

    const secondMap = getOrCreatePendingMap(TestController);
    expect(secondMap).toBe(firstMap);
    expect(secondMap.size).toBe(1);

    // Different constructors have different maps
    const otherMap = getOrCreatePendingMap(OtherController);
    expect(otherMap).not.toBe(firstMap);
  });

  it("takePendingMap returns undefined if no map exists", () => {
    class EmptyController {}
    expect(takePendingMap(EmptyController)).toBeUndefined();
  });

  it("takePendingMap returns the map and removes it from the registry", () => {
    class TestController {}
    const map = getOrCreatePendingMap(TestController);
    map.set(1, { index: 1, token: token<number>("count"), optional: true });

    // take it
    const takenMap = takePendingMap(TestController);
    expect(takenMap).toBe(map);
    expect(takenMap?.size).toBe(1);

    // subsequent take returns undefined because it was removed
    expect(takePendingMap(TestController)).toBeUndefined();
  });
});
