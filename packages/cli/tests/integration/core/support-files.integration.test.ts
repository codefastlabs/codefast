import { LoadCodefastConfigUseCase } from "#/shell/application/use-cases/load-codefast-config.use-case";
import { PresentAnalyzeReportPresenterToken } from "#/domains/arrange/composition/tokens";
import { CliCommandPortToken } from "#/shell/composition/tokens";
import {
  PresentTagSyncProgressPresenterToken,
  PresentTagSyncResultPresenterToken,
} from "#/domains/tag/composition/tokens";

describe("support files integration", () => {
  it("loads config via loader port", async () => {
    const reportSchemaWarnings = vi.fn();
    const useCase = new LoadCodefastConfigUseCase(
      {
        loadConfig: vi.fn(async () => ({
          config: { mirror: { skipPackages: [] } },
          warnings: ["warn-1"],
        })),
      },
      { reportSchemaWarnings },
    );
    const outcome = await useCase.execute("/tmp/root");

    expect(outcome.ok).toBe(true);
    if (!outcome.ok) {
      throw new Error("expected ok result");
    }
    expect(reportSchemaWarnings).toHaveBeenCalledWith(["warn-1"]);
  });

  it("maps loader errors to INFRA_FAILURE", async () => {
    const useCase = new LoadCodefastConfigUseCase(
      {
        loadConfig: vi.fn(async () => {
          throw new Error("broken config");
        }),
      },
      { reportSchemaWarnings: vi.fn() },
    );
    const outcome = await useCase.execute("/tmp/root");

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
    expect(PresentTagSyncProgressPresenterToken).toBeDefined();
    expect(CliCommandPortToken).toBeDefined();
  });
});
