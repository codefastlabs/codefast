import { Module } from "@codefast/di";
import { PrepareMirrorOrchestratorToken } from "#/lib/mirror/contracts/tokens";
import { PrepareMirrorOrchestrator } from "#/lib/mirror/presentation/prepare-mirror.orchestrator";
import { PresentationModule } from "#/lib/core/presentation/presentation.module";

export const MirrorPresentationModule = Module.create(
  "cli-mirror-presentation",
  (moduleBuilder) => {
    moduleBuilder.import(PresentationModule);
    moduleBuilder.bind(PrepareMirrorOrchestratorToken).to(PrepareMirrorOrchestrator).singleton();
  },
);
