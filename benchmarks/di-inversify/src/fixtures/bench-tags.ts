/**
 * The tag keys every codefast tag scenario shares.
 *
 * @remarks One module so the rows compare like with like: a `TagKey` carries a process-monotonic id,
 * and two keys declared separately would land on different mask bits and index slots.
 */
import { tag } from "@codefast/di";

/**
 * @since 0.6.0
 */
export const ENV_TAG = tag<string>("env");
/**
 * @since 0.6.0
 */
export const TIER_TAG = tag<string>("tier");
/**
 * @since 0.6.0
 */
export const REGION_TAG = tag<string>("region");
/**
 * @since 0.6.0
 */
export const SHARD_TAG = tag<number>("shard");
/**
 * @since 0.6.0
 */
export const LEVEL_TAG = tag<number>("level");
