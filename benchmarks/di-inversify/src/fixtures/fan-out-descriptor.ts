import type { GraphDescriptor, NodeDescriptor } from "#/fixtures/realistic-graph";

const FAN_OUT_TREE_DEPTH = 3;
const FAN_OUT_TREE_BREADTH = 4;

/**
 * @since 0.3.16-canary.0
 */
export const RESOLVE_ALL_STRATEGY_COUNTS = [10, 100] as const;
/**
 * @since 0.3.16-canary.0
 */
export type ResolveAllStrategyCount = (typeof RESOLVE_ALL_STRATEGY_COUNTS)[number];
/**
 * @since 0.3.16-canary.0
 */
export const RESOLVE_ALL_NAMED_COUNTS = [8, 32] as const;
/**
 * @since 0.3.16-canary.0
 */
export type ResolveAllNamedCount = (typeof RESOLVE_ALL_NAMED_COUNTS)[number];

function ensureTreeShapeIsValid(depth: number, breadth: number): void {
  if (!Number.isInteger(depth) || depth < 2) {
    throw new Error(`fan-out tree depth must be an integer >= 2, received ${String(depth)}`);
  }
  if (!Number.isInteger(breadth) || breadth < 2) {
    throw new Error(`fan-out tree breadth must be an integer >= 2, received ${String(breadth)}`);
  }
}

function buildNodeId(level: number, slot: number): string {
  return `FanOutNode_L${String(level)}_S${String(slot)}`;
}

/**
 * Builds a complete transient fan-out tree.
 *
 * For depth=3 and breadth=4 this yields:
 * - level 0: 1 root
 * - level 1: 4 middle nodes
 * - level 2: 16 leaf nodes
 * => 21 total nodes.
 */
function buildFanOutTreeDescriptor(depth: number, breadth: number): GraphDescriptor {
  ensureTreeShapeIsValid(depth, breadth);

  const nodes: Array<NodeDescriptor> = [];
  const levelSlots: Array<number> = [1];
  for (let level = 0; level < depth; level++) {
    const currentLevelSlotCount = levelSlots[level] ?? 0;
    const isLeafLevel = level === depth - 1;
    for (let slot = 0; slot < currentLevelSlotCount; slot++) {
      const nodeId = buildNodeId(level, slot);
      const dependencyIds: Array<string> = [];
      if (!isLeafLevel) {
        const nextLevelStartSlot = slot * breadth;
        for (let childOffset = 0; childOffset < breadth; childOffset++) {
          dependencyIds.push(buildNodeId(level + 1, nextLevelStartSlot + childOffset));
        }
      }
      nodes.push({
        id: nodeId,
        lifetime: "transient",
        dependencies: dependencyIds,
      });
    }
    levelSlots.push(currentLevelSlotCount * breadth);
  }

  return {
    rootId: buildNodeId(0, 0),
    nodes,
  };
}

/**
 * @since 0.3.16-canary.0
 */
export const FAN_OUT_TREE_DEPTH_3_BREADTH_4 = buildFanOutTreeDescriptor(
  FAN_OUT_TREE_DEPTH,
  FAN_OUT_TREE_BREADTH,
);
