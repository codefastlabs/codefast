import { describe, expect, it, vi } from "vitest";

import type { ConstituentKind } from "#audit/props/domain/props-intersection";
import { runPropsAudit } from "#audit/props/run";
import type { PropsTypeProbe } from "#audit/props/type-probe";
import { createAuditContext } from "#tests/unit/support/audit-context";

/** A probe that resolves every part by its text, standing in for the type server. */
function fakeProbe(kindsByText: Record<string, ConstituentKind>, dispose: () => void = () => {}): PropsTypeProbe {
  return {
    forFile: () => (parts) => parts.map(({ text }) => kindsByText[text] ?? "object"),
    dispose,
  };
}

describe("runPropsAudit", () => {
  it("reports what the probe resolves to object parts, keeps a union, and disposes the probe", async () => {
    const { context } = await createAuditContext({
      "packages/a/src/a.tsx": [
        "type BoxProps = Base & { b: string };",
        "type PickProps = Choice & { c: string };",
      ].join("\n"),
      "packages/a/src/plain.ts": "export const plain = 1;\n",
    });
    const dispose = vi.fn();

    const result = await runPropsAudit(context, async () => fakeProbe({ Choice: "union" }, dispose));

    expect(result.ok && result.value).toMatchObject({
      scannedFiles: 2,
      findings: [{ file: "packages/a/src/a.tsx", line: 1 }],
    });
    expect(dispose).toHaveBeenCalledTimes(1);
  });

  it("reports an inline props parameter of object parts, and keeps one over a union", async () => {
    const { context } = await createAuditContext({
      "packages/a/src/a.tsx": [
        "function Box(props: Base & { b: string }) {}",
        "function Pick(props: Choice & { c: string }) {}",
        "function Plain(props: Base) {}",
      ].join("\n"),
    });

    const result = await runPropsAudit(context, async () => fakeProbe({ Choice: "union" }));

    expect(result.ok && result.value.findings).toMatchObject([
      { file: "packages/a/src/a.tsx", line: 1, text: "Base & { b: string }" },
    ]);
  });

  it("never starts the type server for a tree without a candidate", async () => {
    const { context } = await createAuditContext({ "src/plain.ts": 'type PlainProps = ComponentProps<"div">;\n' });
    const createProbe = vi.fn(async () => fakeProbe({}));

    const result = await runPropsAudit(context, createProbe);

    expect(result.ok && result.value).toMatchObject({ findings: [], scannedFiles: 1 });
    expect(createProbe).not.toHaveBeenCalled();
  });

  it("returns a failed result when the type server cannot start", async () => {
    const { context } = await createAuditContext({ "src/a.tsx": "type BoxProps = Base & { b: string };\n" });

    const result = await runPropsAudit(context, async () => {
      throw new Error("no type server");
    });

    expect(result.ok).toBe(false);
  });
});
