/**
 * Query Interface
 *
 * Base interface for all queries in the CQRS pattern.
 * Queries represent read operations that don't change system state.
 */

export interface Query {
  readonly timestamp: Date;
}
