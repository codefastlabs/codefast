import { describe, expect, it } from "vitest";

import { cell, renderConsoleTable } from "#/report/console-table";
import { createPalette } from "#/shared/palette";

const ESCAPE = String.fromCodePoint(0x1b);

describe("renderConsoleTable", () => {
  it("pads every column to its widest cell, right-aligning where asked", () => {
    const lines = renderConsoleTable(
      [cell("name"), cell("ratio", undefined, "right")],
      [
        [cell("a"), cell("2.00×")],
        [cell("longer"), cell("10.4×")],
      ],
    );
    expect(lines).toEqual(["name    ratio", "a       2.00×", "longer  10.4×"]);
  });

  it("tints after padding, so the coloured table strips back to the plain one", () => {
    const palette = createPalette({ enabled: true });
    const header = [cell("name"), cell("ratio", undefined, "right")];
    const rows = [[cell("a"), cell("2.00×", palette.win)]];
    const plain = renderConsoleTable(
      header,
      rows.map((row) => row.map((entry) => cell(entry.text))),
    );
    const colored = renderConsoleTable(header, rows, { headerTint: palette.heading });
    expect(colored.map((line) => line.replaceAll(new RegExp(`${ESCAPE}\\[[0-9;]*m`, "g"), ""))).toEqual(plain);
    expect(colored[1]).toContain(`${ESCAPE}[32m2.00×${ESCAPE}[39m`);
  });
});
