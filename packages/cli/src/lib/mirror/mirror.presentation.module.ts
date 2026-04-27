import { Module } from "@codefast/di";
import { PresentationModule } from "#/lib/core/presentation/presentation.module";

export const MirrorPresentationModule = Module.create(
  "cli-mirror-presentation",
  (moduleBuilder) => {
    moduleBuilder.import(PresentationModule);
  },
);
