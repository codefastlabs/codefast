import { Container } from "@codefast/di";
import { ArrangeModule } from "#lib/arrange/arrange.module";
import { CoreModule } from "#lib/core/core.module";
import { InfraModule } from "#lib/core/infra/infra.module";
import { PresentationModule } from "#lib/core/presentation/presentation.module";
import { MirrorModule } from "#lib/mirror/mirror.module";
import { TagModule } from "#lib/tag/tag.module";
import { CliGlobalCliRawToken, CliRootDirToken, WorkspaceContextBinderToken } from "#lib/tokens";

export function createCliRuntimeContainer(): ReturnType<typeof Container.create> {
  const di = Container.create();
  di.bind(CliRootDirToken).toConstantValue(process.cwd()).singleton().build();
  di.bind(CliGlobalCliRawToken).toConstantValue(undefined).singleton().build();
  const bindWorkspaceContext = (args: {
    readonly rootDir: string;
    readonly globalCliRaw?: unknown;
  }): void => {
    di.rebind(CliRootDirToken).toConstantValue(args.rootDir).singleton().build();
    di.rebind(CliGlobalCliRawToken)
      .toConstantValue(args.globalCliRaw ?? undefined)
      .singleton()
      .build();
  };
  di.bind(WorkspaceContextBinderToken).toConstantValue(bindWorkspaceContext).singleton().build();
  di.load(CoreModule, InfraModule, PresentationModule, ArrangeModule, MirrorModule, TagModule);
  return di;
}
