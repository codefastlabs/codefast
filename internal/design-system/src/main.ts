import { writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildAssets } from "#assets";
import { ASSET_GROUPS, NAMESPACE, SYSTEM_NAME } from "#config";
import { buildComponentDocs, buildDeclarations } from "#docs";
import { buildBrandBook, buildPalettes } from "#documents";
import type { OutputFile } from "#output";
import { resetOutput, writeOutput } from "#output";
import { OUTPUT_ROOT } from "#paths";
import { buildPreviews, writePreviewEntries } from "#previews";
import { discoverCards } from "#registry";
import { buildRuntime } from "#runtime";
import { checkPreviews } from "#smoke";
import { buildStyles } from "#styles";
import { buildTokens } from "#tokens";

resetOutput();
const cards = discoverCards();
writePreviewEntries(cards);
const { font, shortfalls, tokens } = buildTokens();
const runtime = await buildRuntime(cards);
const files: Array<OutputFile> = [
  { content: `${JSON.stringify(tokens, null, 2)}\n`, kind: "file", path: "project/tokens.json" },
  { content: buildBrandBook(shortfalls), kind: "file", path: "project/README.md" },
  { content: buildPalettes(), kind: "file", path: "project/Palettes.md" },
  ...buildAssets(font),
  ...runtime.files,
  await buildStyles(),
  ...(await buildPreviews(cards)),
  ...buildComponentDocs(cards),
  buildDeclarations(),
];

const failures = await checkPreviews(files, [
  ...runtime.libraries.map((library) => library.file),
  "components/bundle.js",
]);
if (failures.length > 0) {
  throw new Error(`${failures.length} preview(s) failed to mount:\n${failures.join("\n")}`);
}

writeOutput(files);
// Vector marks lead their group, then names in order, so `mark.svg` comes before `mark-dark.svg` and the lockups.
const assetOrder = (group: string) =>
  files
    .filter((file) => file.kind === "upload" && file.path.startsWith(`project/assets/${group}/`))
    .map((file) => file.path.slice(`project/assets/${group}/`.length))
    .sort((left, right) => {
      const rank = (name: string) => [name.endsWith(".svg") ? 0 : 1, name.replace(/\.\w+$/, "")] as const;
      const [leftKind, leftName] = rank(left);
      const [rightKind, rightName] = rank(right);
      return leftKind - rightKind || leftName.localeCompare(rightName);
    });
// The index keys this build owns; the publisher merges them in and adds each upload's `files` record.
writeFileSync(
  join(OUTPUT_ROOT, "index-fields.json"),
  `${JSON.stringify(
    {
      assetGroups: Object.fromEntries(
        ASSET_GROUPS.map(({ name, tile }) => [name, { name, order: assetOrder(name), tile }]),
      ),
      groups: ASSET_GROUPS.map(({ name }) => name),
      libraries: runtime.libraries,
      namespace: NAMESPACE,
      title: SYSTEM_NAME,
    },
    null,
    2,
  )}\n`,
);

const uploads = files.filter((file) => file.kind === "upload").length;
console.log(
  `${SYSTEM_NAME}: ${cards.length} component cards, ${files.length - uploads} files and ${uploads} uploads in ${OUTPUT_ROOT}` +
    (shortfalls.length > 0 ? ` · ${shortfalls.length} contrast pair(s) flagged` : ""),
);
