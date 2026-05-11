import type { BindingRegistry } from "#/registry";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { BindingScope, Constructor } from "#/types";
import { tokenName } from "#/token";
import { effectiveBindingScope } from "#/binding-scope";

// ── Types ─────────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export interface GraphNode {
  readonly id: string;
  readonly tokenName: string;
  readonly kind: string;
  readonly scope: BindingScope;
  readonly fromParent: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly label?: string;
}

/**
 * @since 0.3.16-canary.0
 */
export interface ContainerGraphJson {
  readonly nodes: ReadonlyArray<GraphNode>;
  readonly edges: ReadonlyArray<GraphEdge>;
  readonly includesParent: boolean;
}

/**
 * @since 0.3.16-canary.0
 */
export interface GraphOptions {
  readonly includeParent?: boolean;
}

// ── Builder ───────────────────────────────────────────────────────────────────

/**
 * @since 0.3.16-canary.0
 */
export function buildDependencyGraph(
  registry: BindingRegistry,
  metadataReader: MetadataReader,
  options: GraphOptions | undefined,
  parentRegistry?: BindingRegistry,
): ContainerGraphJson {
  const nodes: Array<GraphNode> = [];
  const edges: Array<GraphEdge> = [];
  const includesParent = options?.includeParent === true;

  const addBindings = (reg: BindingRegistry, fromParent: boolean): void => {
    for (const binding of reg.allBindings()) {
      const scope = effectiveBindingScope(binding);
      nodes.push({
        id: binding.id,
        tokenName: tokenName(binding.token),
        kind: binding.kind,
        scope,
        fromParent,
      });

      // Build edges
      if (binding.kind === "class") {
        const meta = metadataReader.getConstructorMetadata(binding.target as Constructor);
        if (meta !== undefined) {
          meta.params.forEach((param, index) => {
            const depBinding = reg.getAll(param.token as Constructor)[0];
            if (depBinding !== undefined) {
              edges.push({
                from: binding.id,
                to: depBinding.id,
                label: `[${index}]`,
              });
            }
          });
        }
      } else if (binding.kind === "resolved" || binding.kind === "resolved-async") {
        binding.deps.forEach((dep, index) => {
          const depBindings = reg.getAll(dep.token as Constructor);
          if (depBindings.length > 0 && depBindings[0] !== undefined) {
            const label =
              dep.name !== undefined
                ? `name:${dep.name}`
                : dep.tags !== undefined && dep.tags.length > 0
                  ? `tag:${dep.tags[0]?.[0]}=${String(dep.tags[0]?.[1])}`
                  : `[${index}]`;
            edges.push({ from: binding.id, to: depBindings[0].id, label });
          }
        });
      } else if (binding.kind === "alias") {
        const targetBindings = reg.getAll(binding.target as Constructor);
        if (targetBindings.length > 0 && targetBindings[0] !== undefined) {
          edges.push({ from: binding.id, to: targetBindings[0].id, label: "alias" });
        }
      }
    }
  };

  addBindings(registry, false);
  if (includesParent && parentRegistry !== undefined) {
    addBindings(parentRegistry, true);
  }

  return { nodes, edges, includesParent };
}
