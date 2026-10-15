#!/usr/bin/env node
/** Measures what each library adds to a browser bundle: the smallest bind-and-resolve program, minified and gzipped. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { gzipSync } from "node:zlib";

import { rolldown } from "rolldown";

import { BENCH_LIBRARIES } from "#harness/config";
import { rebuildCodefastDiPackage } from "#harness/rebuild";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const ENTRY_ID = "\0footprint-entry";

/**
 * Each library's smallest program — one container, one value bound and resolved — written the way its documentation
 * sets a project up, so a library that needs `reflect-metadata` ships it.
 */
const PROGRAMS: Readonly<Record<string, string>> = {
  "@codefast/di": `
    import { Container, token } from "@codefast/di";
    const Value = token("footprint:Value");
    const container = Container.create();
    container.bind(Value).toConstantValue(1);
    console.log(container.resolve(Value));`,
  inversify: `
    import "reflect-metadata";
    import { Container } from "inversify";
    const Value = Symbol("Value");
    const container = new Container();
    container.bind(Value).toConstantValue(1);
    console.log(container.get(Value));`,
  awilix: `
    import { asValue, createContainer } from "awilix";
    const container = createContainer();
    container.register({ value: asValue(1) });
    console.log(container.resolve("value"));`,
  tsyringe: `
    import "reflect-metadata";
    import { container } from "tsyringe";
    container.register("value", { useValue: 1 });
    console.log(container.resolve("value"));`,
  brandi: `
    import { createContainer, token } from "brandi";
    const Value = token("value");
    const container = createContainer();
    container.bind(Value).toConstant(1);
    console.log(container.get(Value));`,
  ditox: `
    import { createContainer, token } from "ditox";
    const Value = token();
    const container = createContainer();
    container.bindValue(Value, 1);
    console.log(container.resolve(Value));`,
  "injection-js": `
    import "reflect-metadata";
    import { ReflectiveInjector } from "injection-js";
    const injector = ReflectiveInjector.resolveAndCreate([{ provide: "value", useValue: 1 }]);
    console.log(injector.get("value"));`,
};

/** The polyfill the legacy-decorator libraries need, bundled alone so its share of their rows reads off one line. */
const POLYFILL_PROGRAM = `import "reflect-metadata";`;

interface Footprint {
  readonly label: string;
  readonly minifiedBytes: number;
  readonly gzippedBytes: number;
}

async function measure(label: string, source: string): Promise<Footprint> {
  const build = await rolldown({
    input: ENTRY_ID,
    cwd: packageRootDirectory,
    platform: "browser",
    logLevel: "silent",
    plugins: [
      {
        name: "footprint-entry",
        resolveId: (id) => (id === ENTRY_ID ? id : null),
        load: (id) => (id === ENTRY_ID ? source : null),
      },
    ],
  });
  try {
    const { output } = await build.generate({ format: "esm", minify: true });
    const code = output
      .filter((item) => item.type === "chunk")
      .map((chunk) => chunk.code)
      .join("");
    return { label, minifiedBytes: Buffer.byteLength(code), gzippedBytes: gzipSync(code, { level: 9 }).byteLength };
  } finally {
    await build.close();
  }
}

function kilobytes(bytes: number): string {
  return `${(bytes / 1000).toFixed(1)} KB`;
}

async function main(): Promise<void> {
  rebuildCodefastDiPackage();
  const footprints: Array<Footprint> = [];
  for (const library of BENCH_LIBRARIES) {
    const program = PROGRAMS[library.libraryName];
    if (program === undefined) {
      throw new Error(`No footprint program for ${library.libraryName}: add one to PROGRAMS.`);
    }
    footprints.push(await measure(library.displayName ?? library.libraryName, program));
  }
  footprints.push(await measure("`reflect-metadata` alone", POLYFILL_PROGRAM));
  const rows = footprints.map(
    ({ label, minifiedBytes, gzippedBytes }) =>
      `| ${label} | ${kilobytes(minifiedBytes)} | ${kilobytes(gzippedBytes)} |`,
  );
  console.log(["| Library | Minified | Gzipped |", "| --- | ---: | ---: |", ...rows].join("\n"));
}

await main();
