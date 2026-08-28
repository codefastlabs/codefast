/** The application configuration shape and its loader — mocked static values for the example. */

/** The resolved settings the composition root wires adapters from. */
export interface AppConfig {
  readonly database: "in-memory" | "postgres";
  readonly postgresUrl: string;
  readonly stripeKey: string;
  readonly paypalClientId: string;
}

/** Returns fixed example configuration, standing in for a real environment reader. */
export function loadEnvConfig(): AppConfig {
  return {
    database: "in-memory",
    postgresUrl: "postgres://localhost/shop",
    stripeKey: "sk_test_xxx",
    paypalClientId: "AYclient-xxx",
  };
}
