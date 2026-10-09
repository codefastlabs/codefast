import { createHash } from "node:crypto";
import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { OUTPUT_ROOT } from "#paths";

/**
 * One file of the artifact, at the path the artifact serves it from.
 *
 * @remarks
 * An `upload` goes to the artifact's asset store and is named by a record in its index; a `file` is published as is.
 * `contentType` is set only where the extension alone does not name a servable type.
 *
 * @since 0.1.0
 */
export interface OutputFile {
  content: Buffer | string;
  contentType?: string;
  kind: "file" | "upload";
  path: string;
}

/**
 * Clears the previous run's output, keeping nothing a stale build could leave behind.
 *
 * @since 0.1.0
 */
export function resetOutput(): void {
  rmSync(OUTPUT_ROOT, { force: true, recursive: true });
}

/**
 * Writes every file under `dist/` and a `files.json` manifest of their hashes.
 *
 * @remarks
 * The manifest is what a publisher diffs against the last published run, so a re-sync sends only what changed.
 *
 * @since 0.1.0
 */
export function writeOutput(files: Array<OutputFile>): void {
  const manifest: Record<string, { contentType?: string; kind: OutputFile["kind"]; sha256: string; size: number }> = {};
  for (const file of [...files].sort((left, right) => left.path.localeCompare(right.path))) {
    const target = join(OUTPUT_ROOT, file.path);
    mkdirSync(dirname(target), { recursive: true });
    writeFileSync(target, file.content);
    manifest[file.path] = {
      ...(file.contentType ? { contentType: file.contentType } : {}),
      kind: file.kind,
      sha256: createHash("sha256").update(file.content).digest("hex"),
      size: Buffer.byteLength(file.content),
    };
  }
  writeFileSync(join(OUTPUT_ROOT, "files.json"), `${JSON.stringify(manifest, null, 2)}\n`);
}
