import { spawn, type ChildProcess } from "node:child_process";

import { APP_ROOT, envForSpawnedDevServer } from "#/tests/e2e/support/app-env";
import { E2E_BASE_URL } from "#/tests/e2e/support/base-url";

const READY_TIMEOUT_MS = 120_000;
/** Tight poll — Vite often answers within the first second once the port opens. */
const POLL_MS = 100;
const FETCH_TIMEOUT_MS = 500;

async function isAppReachable(url: string): Promise<boolean> {
  try {
    const response = await fetch(url, {
      redirect: "manual",
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });
    return response.status > 0 && response.status < 500;
  } catch {
    return false;
  }
}

async function waitForApp(url: string, timeoutMs: number): Promise<void> {
  const deadline = Date.now() + timeoutMs;

  while (Date.now() < deadline) {
    if (await isAppReachable(url)) {
      return;
    }

    await new Promise((resolve) => {
      setTimeout(resolve, POLL_MS);
    });
  }

  throw new Error(`apps/ui did not become ready at ${url} within ${timeoutMs}ms`);
}

/**
 * Starts `pnpm dev` from `apps/ui` when nothing is listening on `E2E_BASE_URL`
 * (default `http://localhost:3000`), otherwise reuses the already-running server.
 * Cwd is the app root so Vite auto-loads `.env` / `.env.local` (including
 * `VITE_GA4_MEASUREMENT_ID`); we also merge `.env.local` into the child env for
 * keys not already set. Teardown only kills a process we spawned. Prefer warm
 * reuse for local iteration; `vite preview` was not faster enough cold to replace
 * `pnpm dev` here.
 */
export default async function globalSetup(): Promise<() => Promise<void>> {
  if (await isAppReachable(E2E_BASE_URL)) {
    return async () => {
      // Reused an external server — leave it alone.
    };
  }

  const child: ChildProcess = spawn("pnpm", ["dev"], {
    cwd: APP_ROOT,
    env: envForSpawnedDevServer(),
    stdio: ["ignore", "pipe", "pipe"],
  });

  let stdout = "";
  let stderr = "";
  child.stdout?.on("data", (chunk: Buffer | string) => {
    stdout += String(chunk);
  });
  child.stderr?.on("data", (chunk: Buffer | string) => {
    stderr += String(chunk);
  });

  try {
    await waitForApp(E2E_BASE_URL, READY_TIMEOUT_MS);
  } catch (error) {
    child.kill("SIGTERM");
    const logs = [stdout && `--- pnpm dev stdout ---\n${stdout}`, stderr && `--- pnpm dev stderr ---\n${stderr}`]
      .filter(Boolean)
      .join("\n");
    throw new Error(`${error instanceof Error ? error.message : String(error)}${logs ? `\n${logs}` : ""}`);
  }

  return async () => {
    if (child.pid === undefined) {
      return;
    }

    child.kill("SIGTERM");
    await new Promise<void>((resolve) => {
      const timer = setTimeout(() => {
        child.kill("SIGKILL");
        resolve();
      }, 5_000);

      child.once("exit", () => {
        clearTimeout(timer);
        resolve();
      });
    });
  };
}
