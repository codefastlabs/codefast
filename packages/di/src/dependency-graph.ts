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

  const addBindings = (sourceRegistry: BindingRegistry, fromParent: boolean): void => {
    for (const binding of sourceRegistry.allBindings()) {
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
            const dependencyBinding = sourceRegistry.getAll(param.token as Constructor)[0];
            if (dependencyBinding !== undefined) {
              edges.push({
                from: binding.id,
                to: dependencyBinding.id,
                label: `[${index}]`,
              });
            }
          });
        }
      } else if (binding.kind === "resolved" || binding.kind === "resolved-async") {
        binding.deps.forEach((dependency, index) => {
          const dependencyBindings = sourceRegistry.getAll(dependency.token as Constructor);
          if (dependencyBindings.length > 0 && dependencyBindings[0] !== undefined) {
            const label =
              dependency.name !== undefined
                ? `name:${dependency.name}`
                : dependency.tags !== undefined && dependency.tags.length > 0
                  ? `tag:${dependency.tags[0]?.[0]}=${String(dependency.tags[0]?.[1])}`
                  : `[${index}]`;
            edges.push({ from: binding.id, to: dependencyBindings[0].id, label });
          }
        });
      } else if (binding.kind === "alias") {
        const targetBindings = sourceRegistry.getAll(binding.target as Constructor);
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
