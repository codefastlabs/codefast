/**
 * Get Project Statistics Query
 *
 * Query for retrieving project analysis statistics.
 * This is a read operation that doesn't change system state.
 */

import type { Query } from "@/application/query/query.interface";

export class GetProjectStatisticsQuery implements Query {
  readonly timestamp: Date;

  constructor(
    public readonly pattern = "src/**/*.ts",
    public readonly tsConfigPath?: string,
  ) {
    this.timestamp = new Date();
  }
}
