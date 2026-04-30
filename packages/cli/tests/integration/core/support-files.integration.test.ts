import { PresentAnalyzeReportPresenterToken } from "#/domains/arrange/contracts/tokens";
import { loadCodefastConfig } from "#/domains/config/application/services/load-config.service";
import { CliCommandToken } from "#/shell/contracts/tokens";
import {
  PresentTagSyncResultPresenterToken,
  TagSyncProgressListenerToken,
} from "#/domains/tag/contracts/tokens";

describe("support files integration", () => {
  it("loads config via loader port", async () => {
    const outcome = await loadCodefastConfig(
      {
        loadConfig: vi.fn(async () => ({
          config: { mirror: { skipPackages: [] } },
          warnings: ["warn-1"],
        })),
      },
      "/tmp/root",
    );

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok result");
    }
    expect(outcome.value.warnings).toEqual(["warn-1"]);
  });

  it("maps loader errors to INFRA_FAILURE", async () => {
    const outcome = await loadCodefastConfig(
      {
        loadConfig: vi.fn(async () => {
          throw new Error("broken config");
        }),
      },
      "/tmp/root",
    );

    expect(outcome.ok).toBe(false);
    if (outcome.ok) {
      throw new Error("expected error result");
    }
    expect(outcome.error.code).toBe("INFRA_FAILURE");
    expect(outcome.error.message).toContain("broken config");
  });

  it("exports DI tokens for CLI wiring", () => {
    expect(PresentAnalyzeReportPresenterToken).toBeDefined();
    expect(PresentTagSyncResultPresenterToken).toBeDefined();
    expect(TagSyncProgressListenerToken).toBeDefined();
    expect(CliCommandToken).toBeDefined();
  });
});
