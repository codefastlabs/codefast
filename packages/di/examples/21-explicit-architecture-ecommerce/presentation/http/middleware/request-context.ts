/** The per-request context — resolved once per request scope to carry a correlation id. */

import { token } from "@codefast/di";

/** Identifies a single request as it flows through the application. */
export interface RequestContext {
  readonly correlationId: string;
}

/** Injection token for the per-request context. */
export const RequestContextToken = token<RequestContext>("RequestContext");
