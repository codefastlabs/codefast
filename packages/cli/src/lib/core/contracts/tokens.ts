import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { TryLoadCodefastConfigPresenter } from "#/lib/core/contracts/presentation.contract";

export const TryLoadCodefastConfigPresenterToken: Token<TryLoadCodefastConfigPresenter> =
  token<TryLoadCodefastConfigPresenter>("TryLoadCodefastConfigPresenter");
