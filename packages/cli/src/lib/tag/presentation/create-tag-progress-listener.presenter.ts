import { injectable } from "@codefast/di";
import type { CreateTagProgressListenerPresenter } from "#/lib/tag/contracts/presentation.contract";
import { createTagProgressListener } from "#/lib/tag/presentation/tag-sync.presenter";

@injectable([])
export class CreateTagProgressListenerPresenterImpl implements CreateTagProgressListenerPresenter {
  create(emitLine: (line: string) => void) {
    return createTagProgressListener(emitLine);
  }
}
