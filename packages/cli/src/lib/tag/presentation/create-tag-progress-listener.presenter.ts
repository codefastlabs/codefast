import { injectable } from "@codefast/di";
import type { CreateTagProgressListenerPresenter } from "#/lib/tokens";
import { createTagProgressListener } from "#/lib/tag/presentation/tag-sync.presenter";

@injectable([])
export class CreateTagProgressListenerPresenterImpl implements CreateTagProgressListenerPresenter {
  create(emitLine: (line: string) => void) {
    return createTagProgressListener(emitLine);
  }
}
