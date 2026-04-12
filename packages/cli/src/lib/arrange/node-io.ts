import fs from "node:fs";
import process from "node:process";
import type { ArrangeFs, ArrangeLogger } from "#lib/arrange/fs-contract";

export function createNodeArrangeFs(): ArrangeFs {
  return {
    existsSync: fs.existsSync,
    statSync: fs.statSync,
    readFileSync: fs.readFileSync,
    writeFileSync: fs.writeFileSync,
    readdirSync: fs.readdirSync,
  };
}

export function createNodeArrangeLogger(): ArrangeLogger {
  return {
    out: (line: string) => {
      process.stdout.write(`${line}\n`);
    },
    err: (line: string) => {
      process.stderr.write(`${line}\n`);
    },
  };
}
