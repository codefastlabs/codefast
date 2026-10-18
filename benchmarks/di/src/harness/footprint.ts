#!/usr/bin/env node
/** Measures what each library adds to a browser bundle: the smallest bind-and-resolve program, minified and gzipped. */
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { rebuildSubjectPackage } from "@internal/benchmark-harness/parent/rebuild-subject-package";
import { runFootprintMain } from "@internal/benchmark-harness/results/footprint";

import { BENCH_LIBRARIES, CODEFAST_DI } from "#harness/config";

const packageRootDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "..");

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

await runFootprintMain({
  packageRootDirectory,
  subject: CODEFAST_DI,
  libraries: BENCH_LIBRARIES,
  programs: PROGRAMS,
  extraPrograms: [{ label: "`reflect-metadata` alone", source: POLYFILL_PROGRAM }],
  rebuild: () => rebuildSubjectPackage(CODEFAST_DI.libraryName, packageRootDirectory),
});
