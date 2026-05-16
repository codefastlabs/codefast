import { createServer } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { findAvailablePort } from "#/server/port";

function bindLoopback(
  port = 0,
): Promise<{ server: ReturnType<typeof createServer>; port: number }> {
  return new Promise((resolve, reject) => {
    const server = createServer();
    server.once("error", reject);
    server.listen(port, "127.0.0.1", () => {
      resolve({ server, port: (server.address() as AddressInfo).port });
    });
  });
}

function closeServer(server: ReturnType<typeof createServer>): Promise<void> {
  return new Promise((resolve, reject) => server.close((err) => (err ? reject(err) : resolve())));
}

describe("findAvailablePort", () => {
  const servers: Array<ReturnType<typeof createServer>> = [];

  afterEach(async () => {
    await Promise.all(servers.splice(0).map(closeServer));
  });

  it("returns the preferred port when it is free", async () => {
    const { server, port } = await bindLoopback();
    await closeServer(server);

    const found = await findAvailablePort(port);
    expect(found).toBe(port);
  });

  it("falls back to preferred + 1 when preferred is occupied", async () => {
    const { server, port: occupied } = await bindLoopback();
    servers.push(server);

    const found = await findAvailablePort(occupied);
    expect(found).toBe(occupied + 1);
  });

  it("skips multiple consecutive occupied ports", async () => {
    const { server: s1, port: base } = await bindLoopback();
    const { server: s2 } = await bindLoopback(base + 1);
    servers.push(s1, s2);

    const found = await findAvailablePort(base);
    expect(found).toBe(base + 2);
  });

  it("returned port is actually bindable on 127.0.0.1", async () => {
    const { server: holder, port: occupied } = await bindLoopback();
    servers.push(holder);

    const found = await findAvailablePort(occupied);
    const { server: probe } = await bindLoopback(found);
    servers.push(probe);

    expect((probe.address() as AddressInfo).port).toBe(found);
  });
});
