import { inject, injectable } from "@codefast/di";
import {
  DomainSourceParserPortToken,
  GroupFilePreviewPortToken,
} from "#/lib/arrange/contracts/tokens";
import type { ArrangeFileProcessorService } from "#/lib/arrange/contracts/services.contract";
import type { CliFs } from "#/lib/core/application/ports/cli-io.port";
import { CliFsToken } from "#/lib/core/operational/contracts/tokens";
import type { DomainSourceParserPort } from "#/lib/arrange/application/ports/domain-source-parser.port";
import type { GroupFilePreviewPort } from "#/lib/arrange/application/ports/group-file-preview.port";
import { groupFile } from "#/lib/arrange/application/use-cases/group-file.use-case";
import type { ArrangeGroupFileOptions, GroupFileResult } from "#/lib/arrange/domain/types.domain";

@injectable([
  inject(CliFsToken),
  inject(DomainSourceParserPortToken),
  inject(GroupFilePreviewPortToken),
])
export class ArrangeFileProcessorServiceImpl implements ArrangeFileProcessorService {
  constructor(
    private readonly fs: CliFs,
    private readonly domainSourceParser: DomainSourceParserPort,
    private readonly groupFilePreview: GroupFilePreviewPort,
  ) {}

  processFile(args: {
    readonly filePath: string;
    readonly options: ArrangeGroupFileOptions;
  }): GroupFileResult {
    return groupFile(
      args.filePath,
      args.options,
      this.fs,
      this.domainSourceParser,
      this.groupFilePreview,
    );
  }
}
