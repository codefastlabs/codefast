/** Every row a `tv()` library runs, built once against whichever library a subprocess loads. */
import type { TvLibrary } from "#lib/tv-library";
import { buildCnScenarios } from "#scenarios/tv/cn";
import { buildComplexScenarios } from "#scenarios/tv/complex";
import { buildCompoundSlotsScenarios } from "#scenarios/tv/compound-slots";
import { buildCreateTvScenarios } from "#scenarios/tv/create-tv";
import { buildDataCellsScenarios } from "#scenarios/tv/data-cells";
import { buildDefineOnlyScenarios } from "#scenarios/tv/define-only";
import { buildExtendsScenarios } from "#scenarios/tv/extends";
import { buildExtremeScenarios } from "#scenarios/tv/extreme";
import { buildExtremeSlotsScenarios } from "#scenarios/tv/extreme-slots";
import { buildFewRendersScenarios } from "#scenarios/tv/few-renders";
import { buildFirstRenderScenarios } from "#scenarios/tv/first-render";
import { buildNovelClassesScenarios } from "#scenarios/tv/novel-classes";
import { buildOverrideScenarios } from "#scenarios/tv/override";
import { buildRepeatScenarios } from "#scenarios/tv/repeat";
import { buildSimpleScenarios } from "#scenarios/tv/simple";
import { buildSlotClassScenarios } from "#scenarios/tv/slot-class";
import { buildSlotsScenarios } from "#scenarios/tv/slots";
import { buildWideSlotsScenarios } from "#scenarios/tv/wide-slots";
import type { BenchScenario } from "#scenarios/types";

/**
 * Builds every shared row for one library, in run order.
 *
 * @param library - The library every row drives.
 * @param controls - Rows only this library has, run right after the `repeat-*` rows they control for.
 *
 * @since 0.11.1
 */
export function collectTvScenarios(
  library: TvLibrary,
  controls: ReadonlyArray<BenchScenario> = [],
): ReadonlyArray<BenchScenario> {
  return [
    ...buildSimpleScenarios(library),
    ...buildComplexScenarios(library),
    ...buildSlotsScenarios(library),
    ...buildCompoundSlotsScenarios(library),
    ...buildExtendsScenarios(library),
    ...buildCreateTvScenarios(library),
    ...buildExtremeScenarios(library),
    ...buildExtremeSlotsScenarios(library),
    ...buildRepeatScenarios(library),
    ...controls,
    ...buildDefineOnlyScenarios(library),
    ...buildFirstRenderScenarios(library),
    ...buildCnScenarios(library),
    ...buildOverrideScenarios(library),
    ...buildSlotClassScenarios(library),
    ...buildDataCellsScenarios(library),
    ...buildWideSlotsScenarios(library),
    ...buildNovelClassesScenarios(library),
    ...buildFewRendersScenarios(library),
  ];
}
