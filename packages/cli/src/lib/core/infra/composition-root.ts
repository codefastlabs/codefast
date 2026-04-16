import { Container } from "@codefast/di";
import { ArrangeCommand } from "#commands/arrange";
import { MirrorCommand } from "#commands/mirror";
import { TagCommand } from "#commands/tag";
import { ArrangeModule } from "#lib/arrange/arrange.module";
import { CoreModule } from "#lib/core/core.module";
import { InfraModule } from "#lib/core/infra/infra.module";
import { PresentationModule } from "#lib/core/presentation/presentation.module";
import { COMMAND_TOKEN } from "#lib/core/presentation/tokens";
import { MirrorModule } from "#lib/mirror/mirror.module";
import { TagModule } from "#lib/tag/tag.module";

export function createCliRuntimeContainer(): ReturnType<typeof Container.create> {
  const di = Container.create();
  di.load(CoreModule, InfraModule, PresentationModule, ArrangeModule, MirrorModule, TagModule);
  // Multi-bind CLI commands at container level. Module bindings are last-wins per key.
  di.bind(COMMAND_TOKEN).to(ArrangeCommand).singleton().whenNamed("arrange");
  di.bind(COMMAND_TOKEN).to(MirrorCommand).singleton().whenNamed("mirror");
  di.bind(COMMAND_TOKEN).to(TagCommand).singleton().whenNamed("tag");
  return di;
}
