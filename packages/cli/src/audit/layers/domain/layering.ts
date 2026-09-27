/**
 * The layering rule one package's `src/` follows: a value import never points up the configured layers.
 */
import path from "node:path";

import { parseSync } from "oxc-parser";

import type { LayerViolation } from "#audit/domain/types";
import type { OxcNode } from "#core/oxc-node";
import { isOxcNode, programStatements } from "#core/oxc-node";
import { firstLineOf, lineOfOffset } from "#core/source-position";

const MODULE_EXTENSIONS = [".tsx", ".ts", ".js"] as const;

function withoutModuleExtension(name: string): string {
  for (const extension of MODULE_EXTENSIONS) {
    if (name.endsWith(extension)) {
      return name.slice(0, -extension.length);
    }
  }
  return name;
}

/**
 * The key a layer entry and a module path share: the first path segment, without a module extension.
 *
 * @remarks `errors.ts`, `errors/` and `errors/taxonomy.ts` all key as `errors`, so a layer entry names
 * a family directly under the root — a directory, or a lone module sitting flat.
 *
 * @since 0.14.0
 */
export function layerKeyOf(modulePath: string): string {
  const [first = ""] = modulePath.split("/");
  return withoutModuleExtension(first);
}

/**
 * Returns why a layer list breaks its contract, or `undefined` when every entry is a family under the root, placed once.
 *
 * @since 0.14.0
 */
export function invalidLayerEntry(layers: ReadonlyArray<ReadonlyArray<string>>): string | undefined {
  const seen = new Map<string, string>();
  for (const layer of layers) {
    for (const entry of layer) {
      const trimmed = entry.replace(/\/$/, "");
      if (trimmed === "" || trimmed.includes("/")) {
        return `layer entry "${entry}" must name a directory or a module file directly under the root`;
      }
      const key = layerKeyOf(trimmed);
      const earlier = seen.get(key);
      if (earlier !== undefined) {
        return `layer entry "${entry}" is already placed by "${earlier}"`;
      }
      seen.set(key, entry);
    }
  }
  return undefined;
}

/**
 * Where a module sits: its layer's position from the bottom, and the entry that placed it there.
 *
 * @since 0.14.0
 */
export interface LayerPlacement {
  readonly index: number;
  readonly entry: string;
}

/**
 * A package's layers, bottom to top, answering the placement of any module path under the root.
 *
 * @since 0.14.0
 */
export class LayerMap {
  readonly #placementByKey = new Map<string, LayerPlacement>();

  constructor(layers: ReadonlyArray<ReadonlyArray<string>>) {
    layers.forEach((layer, index) => {
      for (const entry of layer) {
        this.#placementByKey.set(layerKeyOf(entry.replace(/\/$/, "")), { index, entry });
      }
    });
  }

  /** The placement of a root-relative module path, or `undefined` when no layer names its family. */
  placementOf(modulePath: string): LayerPlacement | undefined {
    return this.#placementByKey.get(layerKeyOf(modulePath));
  }
}

function sourceValueOf(node: OxcNode): string | undefined {
  const source = node.source;
  return isOxcNode(source) && typeof source.value === "string" ? source.value : undefined;
}

function everySpecifierIsTypeOnly(node: OxcNode, kindField: "importKind" | "exportKind"): boolean {
  const specifiers = Array.isArray(node.specifiers) ? node.specifiers.filter(isOxcNode) : [];
  return specifiers.length > 0 && specifiers.every((specifier) => specifier[kindField] === "type");
}

/**
 * The module a top-level statement imports or re-exports at runtime, or `undefined` when it erases at build time.
 */
function valueSpecifierOf(statement: OxcNode): string | undefined {
  if (statement.type === "ImportDeclaration") {
    if (statement.importKind === "type" || everySpecifierIsTypeOnly(statement, "importKind")) {
      return undefined;
    }
    return sourceValueOf(statement);
  }
  if (statement.type === "ExportNamedDeclaration") {
    if (statement.exportKind === "type" || everySpecifierIsTypeOnly(statement, "exportKind")) {
      return undefined;
    }
    return sourceValueOf(statement);
  }
  if (statement.type === "ExportAllDeclaration") {
    return statement.exportKind === "type" ? undefined : sourceValueOf(statement);
  }
  return undefined;
}

/**
 * The root-relative module path a specifier names, or `undefined` for one outside the root (a package, a
 * relative path climbing out).
 *
 * @remarks A `#` subpath import maps to the root directly, which is how every package's `#*` imports
 * field is declared; a relative import resolves against the importing module.
 */
function moduleTargetOf(specifier: string, fromModulePath: string): string | undefined {
  if (specifier.startsWith("#")) {
    const target = specifier.slice(1);
    return target === "" ? undefined : target;
  }
  if (specifier.startsWith("./") || specifier.startsWith("../")) {
    const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(fromModulePath), specifier));
    return resolved.startsWith("../") ? undefined : resolved;
  }
  return undefined;
}

function collectDynamicImports(node: OxcNode, visit: (node: OxcNode, specifier: string) => void): void {
  if (node.type === "ImportExpression") {
    const specifier = sourceValueOf(node);
    if (specifier !== undefined) {
      visit(node, specifier);
    }
  }
  for (const value of Object.values(node)) {
    if (Array.isArray(value)) {
      for (const item of value) {
        if (isOxcNode(item)) {
          collectDynamicImports(item, visit);
        }
      }
    } else if (isOxcNode(value)) {
      collectDynamicImports(value, visit);
    }
  }
}

/**
 * Scans one module against its package's layers and returns the violations: the module sitting in no
 * layer, or a value import or re-export whose target sits in a higher layer, or in none.
 *
 * @remarks Type-only imports and re-exports erase at build time and couple nothing, so they pass
 * whichever way they point. Dynamic `import()` counts as a value import wherever it sits.
 *
 * @since 0.14.0
 */
export function auditLayeringSource(
  filePath: string,
  modulePath: string,
  sourceText: string,
  layers: LayerMap,
): Array<LayerViolation> {
  const own = layers.placementOf(modulePath);
  if (own === undefined) {
    return [
      {
        line: 1,
        raw: modulePath,
        reason: `module sits in no configured layer — place "${layerKeyOf(modulePath)}" in one`,
      },
    ];
  }

  const violations: Array<LayerViolation> = [];
  const check = (node: OxcNode, specifier: string): void => {
    const target = moduleTargetOf(specifier, modulePath);
    if (target === undefined) {
      return;
    }
    const placement = layers.placementOf(target);
    if (placement === undefined) {
      violations.push(violationAt(sourceText, node, `imports "${specifier}", which sits in no configured layer`));
    } else if (placement.index > own.index) {
      violations.push(
        violationAt(
          sourceText,
          node,
          `value import of "${specifier}" points up the layers — ${own.entry} (layer ${String(own.index + 1)}) reaches ${placement.entry} (layer ${String(placement.index + 1)})`,
        ),
      );
    }
  };

  const { program } = parseSync(filePath, sourceText);
  for (const statement of programStatements(program)) {
    const specifier = valueSpecifierOf(statement);
    if (specifier !== undefined) {
      check(statement, specifier);
    }
  }
  if (isOxcNode(program)) {
    collectDynamicImports(program, check);
  }

  violations.sort((a, b) => a.line - b.line);
  return violations;
}

function violationAt(sourceText: string, node: OxcNode, reason: string): LayerViolation {
  return {
    line: lineOfOffset(sourceText, node.start),
    raw: firstLineOf(sourceText.slice(node.start, node.end)),
    reason,
  };
}
