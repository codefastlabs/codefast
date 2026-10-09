import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";

import { bundleScript } from "#bundler";
import { NAMESPACE } from "#config";
import type { OutputFile } from "#output";
import { packagePath, WORK_ROOT } from "#paths";
import type { ComponentCard } from "#registry";

/** A runtime library the previews load before the component bundle, as the artifact's index lists it. */
export interface RuntimeLibrary {
  file: string;
  global: string;
  name: string;
  version: string;
}

const require = createRequire(packagePath("package.json"));

function versionOf(name: string): string {
  const manifest: unknown = JSON.parse(readFileSync(require.resolve(`${name}/package.json`), "utf8"));
  if (
    typeof manifest !== "object" ||
    manifest === null ||
    !("version" in manifest) ||
    typeof manifest.version !== "string"
  ) {
    throw new Error(`${name} has no version`);
  }
  return manifest.version;
}

function writeEntry(name: string, source: string): string {
  mkdirSync(join(WORK_ROOT, "runtime"), { recursive: true });
  const path = join(WORK_ROOT, "runtime", name);
  writeFileSync(path, source);
  return path;
}

/**
 * Builds React, ReactDOM and Recharts as classic scripts, and every `@codefast/ui` export as one more.
 *
 * @remarks
 * React ships no browser global build, so the libraries are bundled here; the component bundle and the previews read
 * them back from `window` instead of carrying their own copies.
 */
export async function buildRuntime(
  cards: Array<ComponentCard>,
): Promise<{ files: Array<OutputFile>; libraries: Array<RuntimeLibrary> }> {
  const libraries: Array<RuntimeLibrary & { source: string; provided: Array<"React" | "ReactDOM"> }> = [
    {
      file: "components/lib/react.js",
      global: "React",
      name: "react",
      provided: [],
      source: 'import * as React from "react";\nwindow.React = React;\n',
      version: versionOf("react"),
    },
    {
      file: "components/lib/react-dom.js",
      global: "ReactDOM",
      name: "react-dom",
      provided: ["React"],
      source:
        'import * as ReactDOM from "react-dom";\nimport * as ReactDOMClient from "react-dom/client";\nwindow.ReactDOM = { ...ReactDOM, ...ReactDOMClient };\n',
      version: versionOf("react-dom"),
    },
    {
      file: "components/lib/recharts.js",
      global: "Recharts",
      name: "recharts",
      provided: ["React", "ReactDOM"],
      source: 'import * as Recharts from "recharts";\nwindow.Recharts = Recharts;\n',
      version: versionOf("recharts"),
    },
  ];
  const files: Array<OutputFile> = [];
  for (const library of libraries) {
    const script = await bundleScript(writeEntry(`${library.name}.js`, library.source), new Set(library.provided));
    files.push({
      content: `/* ${library.name} ${library.version} */\n${script}`,
      kind: "file",
      path: `project/${library.file}`,
    });
  }
  // Each component's own subpath too, so a part its subpath exports but the root entry misses still reaches the previews.
  const entry = writeEntry(
    "components.js",
    [
      'export * from "@codefast/ui";',
      'export { cn, tv } from "@codefast/ui/lib/utils";',
      ...cards.map((card) => `export * from "@codefast/ui/${card.slug}";`),
      "",
    ].join("\n"),
  );
  const header = { components: cards.map((card) => ({ name: card.name })), format: 4, namespace: NAMESPACE };
  const bundle = await bundleScript(entry, new Set(["React", "ReactDOM", "Recharts"]), NAMESPACE);
  files.push({
    content: `/* @ds-bundle: ${JSON.stringify(header)} */\n${bundle}`,
    kind: "file",
    path: "project/components/bundle.js",
  });
  return { files, libraries: libraries.map(({ file, global, name, version }) => ({ file, global, name, version })) };
}
