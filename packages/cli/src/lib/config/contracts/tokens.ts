import type { Token } from "@codefast/di";
import { token } from "@codefast/di";
import type { ConfigLoaderPort } from "#/lib/config/application/ports/config-loader.port";

export const ConfigLoaderPortToken: Token<ConfigLoaderPort> =
  token<ConfigLoaderPort>("ConfigLoaderPort");
