import type { BindingRegistry } from "#/registry";
import type { MetadataReader } from "#/metadata/metadata-types";
import type { BindingScope, Constructor } from "#/types";
import { tokenName } from "#/token";

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GraphNode {
  readonly id: string;
  readonly tokenName: string;
  readonly kind: string;
  readonly scope: BindingScope;
  readonly fromParent: boolean;
}

export interface GraphEdge {
  readonly from: string;
  readonly to: string;
  readonly label?: string;
}

export interface ContainerGraphJson {
  readonly nodes: readonly GraphNode[];
  readonly edges: readonly GraphEdge[];
  readonly includesParent: boolean;
}

export interface GraphOptions {
  readonly includeParent?: boolean;
}

// ── Builder ───────────────────────────────────────────────────────────────────

export function buildDependencyGraph(
  registry: BindingRegistry,
  metadataReader: MetadataReader,
  options: GraphOptions | undefined,
  parentRegistry?: BindingRegistry,
): ContainerGraphJson {
  const nodes: GraphNode[] = [];
  const edges: GraphEdge[] = [];
  const includesParent = options?.includeParent === true;

  const addBindings = (reg: BindingRegistry, fromParent: boolean): void => {
    for (const binding of reg.allBindings()) {
      const scope: BindingScope =
        binding.kind === "alias"
          ? "transient"
          : ((binding as { scope: BindingScope }).scope ?? "transient");
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
          meta.params.forEach((param, idx) => {
            const depBinding = reg.getAll(param.token as Constructor)[0];
            if (depBinding !== undefined) {
              edges.push({
                from: binding.id,
                to: depBinding.id,
                label: `[${idx}]`,
              });
            }
          });
        }
      } else if (binding.kind === "resolved" || binding.kind === "resolved-async") {
        binding.deps.forEach((dep, idx) => {
          const depBindings = reg.getAll(dep.token as Constructor);
          if (depBindings.length > 0 && depBindings[0] !== undefined) {
            const label =
              dep.name !== undefined
                ? `name:${dep.name}`
                : dep.tags !== undefined && dep.tags.length > 0
                  ? `tag:${dep.tags[0]?.[0]}=${String(dep.tags[0]?.[1])}`
                  : `[${idx}]`;
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
