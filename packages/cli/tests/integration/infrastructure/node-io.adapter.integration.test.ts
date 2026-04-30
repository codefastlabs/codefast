import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import type { CliDirectoryEntry } from "#/shell/application/ports/cli-io.port";
import {
  NodeCliFsAdapter,
  NodeCliLoggerAdapter,
  NodeCliRuntimeAdapter,
} from "#/shell/infrastructure/node-io.adapter";

describe("node io adapter integration", () => {
  it("supports fs operations including async readdir variants", async () => {
    const adapter = new NodeCliFsAdapter();
    const rootDir = fs.mkdtempSync(path.join(os.tmpdir(), "node-io-"));
    const sourceFile = path.join(rootDir, "source.txt");
    const renamedFile = path.join(rootDir, "renamed.txt");
    try {
      adapter.writeFileSync(sourceFile, "hello", "utf8");
      expect(adapter.existsSync(sourceFile)).toBe(true);
      expect(adapter.readFileSync(sourceFile, "utf8")).toBe("hello");
      expect(adapter.statSync(sourceFile).isFile()).toBe(true);

      const names = await adapter.readdir(rootDir);
      expect(names).toContain("source.txt");
      const dirents = (await adapter.readdir(rootDir, {
        withFileTypes: true,
      })) as CliDirectoryEntry[];
      expect(dirents.some((entry) => entry.name === "source.txt")).toBe(true);

      await adapter.rename(sourceFile, renamedFile);
      expect(adapter.existsSync(renamedFile)).toBe(true);
      await adapter.unlink(renamedFile);
      expect(adapter.existsSync(renamedFile)).toBe(false);

      await adapter.writeFile(sourceFile, "again", "utf8");
      expect(await adapter.readFile(sourceFile, "utf8")).toBe("again");
    } finally {
      fs.rmSync(rootDir, { recursive: true, force: true });
    }
  });

  it("falls back to path.resolve for canonical path of missing file", () => {
    const adapter = new NodeCliFsAdapter();
    const missingPath = path.join(os.tmpdir(), `missing-${Date.now()}.txt`);
    expect(adapter.canonicalPathSync(missingPath)).toBe(path.resolve(missingPath));
  });

  it("writes logger output to stdout/stderr and runtime reflects process", () => {
    const logger = new NodeCliLoggerAdapter();
    const runtime = new NodeCliRuntimeAdapter();
    const stdoutSpy = vi.spyOn(process.stdout, "write").mockReturnValue(true);
    const stderrSpy = vi.spyOn(process.stderr, "write").mockReturnValue(true);

    logger.out("hello");
    logger.err("oops");
    runtime.setExitCode(9);

    expect(stdoutSpy).toHaveBeenCalledWith("hello\n");
    expect(stderrSpy).toHaveBeenCalledWith("oops\n");
    expect(runtime.cwd()).toBe(process.cwd());
    expect(runtime.isStdoutTty()).toBe(!!process.stdout.isTTY);
    expect(process.exitCode).toBe(9);

    stdoutSpy.mockRestore();
    stderrSpy.mockRestore();
  });
});
