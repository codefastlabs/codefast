/**
 * Base URL for apps/ui e2e. Override with `E2E_BASE_URL` when the app is not on :3000
 * (e.g. another port, or `http://127.0.0.1:4173` for a preview server).
 */
export const E2E_BASE_URL = process.env.E2E_BASE_URL ?? "http://localhost:3000";
