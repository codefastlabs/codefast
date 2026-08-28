/** The outbound port carrying per-request state, and its token. */

import { token } from "@codefast/di";

/** Identifies a single request as it flows through the application. */
export interface RequestContext {
  /** A correlation id unique to this request. */
  readonly requestId: string;
}

/** The injection token that names the per-request context port, resolved once per unit of work. */
export const RequestContextToken = token<RequestContext>("RequestContext");
