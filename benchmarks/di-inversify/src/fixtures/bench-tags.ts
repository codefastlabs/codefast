/**
 * The tag keys every codefast tag scenario shares.
 *
 * @remarks One module so the rows compare like with like: a `TagKey` carries a process-monotonic id,
 * and two keys declared separately would land on different mask bits and index slots.
 */
import { tag } from "@codefast/di";

export const ENV_TAG = tag<string>("env");
export const TIER_TAG = tag<string>("tier");
export const REGION_TAG = tag<string>("region");
export const SHARD_TAG = tag<number>("shard");
export const LEVEL_TAG = tag<number>("level");
