import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { describe, expect, it } from "vitest";

import { findAvailablePort } from "#/server/find-available-port";

describe("findAvailablePort", () => {
  it("returns the preferred port when it is free on loopback", async () => {
    const probe = createServer();
    await new Promise<void>((resolve, reject) => {
      probe.once("error", reject);
      probe.listen(0, "127.0.0.1", resolve);
    });
    const preferred = (probe.address() as AddressInfo).port;
    await new Promise<void>((resolve, reject) =>
      probe.close((err) => (err ? reject(err) : resolve())),
    );

    const found = await findAvailablePort(preferred);
    expect(found).toBe(preferred);
  });

  it("returns another port when the preferred port is held on 127.0.0.1", async () => {
    const holder = createServer();
    await new Promise<void>((resolve, reject) => {
      holder.once("error", reject);
      holder.listen(0, "127.0.0.1", resolve);
    });
    const addr = holder.address() as AddressInfo;
    const occupied = addr.port;

    const found = await findAvailablePort(occupied);
    expect(found).not.toBe(occupied);

    await new Promise<void>((resolve, reject) =>
      holder.close((err) => (err ? reject(err) : resolve())),
    );
  });
});
