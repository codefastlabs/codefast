/**
 * Query Handler Interface
 *
 * Base interface for all query handlers in the CQRS pattern.
 * Query handlers execute queries and return results without side effects.
 */

import type { Query } from "@/application/query/query.interface";

export interface QueryHandler<TQuery extends Query, TResult> {
  handle: (query: TQuery) => Promise<TResult>;
}
