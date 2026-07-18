import { describe, expect, it, vi } from "vitest";

import { buildGa4UserDeletionRequest, submitGa4UserDeletion } from "#/server/user-deletion";

describe("buildGa4UserDeletionRequest", () => {
  // DSR-V3 (updated for the current Admin API, which supersedes the sunset v3 shape).
  it("targets the Admin API submitUserDeletion endpoint with a flat clientId body", () => {
    expect(buildGa4UserDeletionRequest({ clientId: "111.222", propertyId: "1234567" })).toEqual({
      body: { clientId: "111.222" },
      url: "https://analyticsadmin.googleapis.com/v1alpha/properties/1234567:submitUserDeletion",
    });
  });
});

describe("submitGa4UserDeletion", () => {
  it("posts the deletion with a bearer token through the injected transport", async () => {
    const transport = vi.fn((_request: { body: string; headers: Record<string, string>; url: string }) =>
      Promise.resolve(),
    );

    await submitGa4UserDeletion({
      accessToken: "ya29.token",
      clientId: "111.222",
      propertyId: "1234567",
      transport,
    });

    const request = transport.mock.calls[0]?.[0];

    expect(request?.url).toBe("https://analyticsadmin.googleapis.com/v1alpha/properties/1234567:submitUserDeletion");
    expect(request?.headers.authorization).toBe("Bearer ya29.token");
    expect(JSON.parse(request?.body ?? "{}")).toEqual({ clientId: "111.222" });
  });
});
