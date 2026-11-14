import type { Detection } from "#audit/domain/types";
import {
  DIRECTION_RESOLVED_VARIANT,
  PHYSICAL_SIDE_VARIANT,
  RTL_MAPPINGS,
  RTL_REVERSE_MAPPINGS,
  RTL_SWAP_MAPPINGS,
  RTL_TRANSLATE_X_MAPPINGS,
  SLIDE_PREFIXES,
} from "#audit/rtl/domain/mappings";
import type { RtlClassToken } from "#audit/rtl/domain/tokenize";
import { collectTokens } from "#audit/rtl/domain/tokenize";

/**
 * A token satisfies an "rtl companion" requirement when the same file has a
 * token whose variants include `rtl` and whose value matches. Variant order
 * differs between authors, so this stays deliberately loose.
 *
 * @since 0.5.0-canary.6
 */
function hasRtlCompanion(fileTokens: ReadonlyArray<RtlClassToken>, expectedValue: string): boolean {
  return fileTokens.some(({ variant, value }) => {
    if (!variant) {
      return false;
    }
    const variants = variant.split(":");
    if (!variants.includes("rtl")) {
      return false;
    }
    return value === expectedValue || value.startsWith(expectedValue);
  });
}

/**
 * Detects physical-direction Tailwind classes that should be logical or rtl:-paired.
 *
 * @since 0.5.0-canary.6
 */
export function auditFileContent(content: string): Array<Detection> {
  const tokens = collectTokens(content);
  const violations: Array<Detection> = [];

  for (const { raw, token, variant, value, line } of tokens) {
    if (token.startsWith("rtl:") || token.startsWith("ltr:")) {
      continue;
    }
    const variants = variant ? variant.split(":") : [];
    if (variants.includes("rtl") || variants.includes("ltr")) {
      continue;
    }

    const isPhysicalSideVariant = variant !== null && PHYSICAL_SIDE_VARIANT.test(variant);
    if (isPhysicalSideVariant) {
      continue;
    }

    const translateMapping = RTL_TRANSLATE_X_MAPPINGS.find(([physical]) => value.startsWith(physical));
    if (translateMapping) {
      // ±0 is direction-neutral — negating it changes nothing.
      if (/^-?translate-x-0$/.test(value)) {
        continue;
      }
      const expected = value.replace(translateMapping[0], translateMapping[1]);
      if (!hasRtlCompanion(tokens, expected)) {
        violations.push({
          line,
          raw,
          reason: `add rtl:${expected} (or rtl:…:${expected})`,
        });
      }
      continue;
    }

    const reverseMapping = RTL_REVERSE_MAPPINGS.find(
      ([prefix]) => value.startsWith(prefix) || value.startsWith(`-${prefix}`),
    );
    if (reverseMapping) {
      if (value.includes("reverse")) {
        continue;
      }
      if (!hasRtlCompanion(tokens, reverseMapping[1])) {
        violations.push({ line, raw, reason: `add rtl:${reverseMapping[1]}` });
      }
      continue;
    }

    const swapMapping = RTL_SWAP_MAPPINGS.find(([physical]) => value === physical);
    if (swapMapping) {
      if (!hasRtlCompanion(tokens, swapMapping[1])) {
        violations.push({ line, raw, reason: `add rtl:${swapMapping[1]}` });
      }
      continue;
    }

    if (SLIDE_PREFIXES.some((prefix) => value.startsWith(prefix))) {
      if (variant && DIRECTION_RESOLVED_VARIANT.test(variant)) {
        continue;
      }
      violations.push({
        line,
        raw,
        reason: "check: physical slide outside a side/motion context",
      });
      continue;
    }

    for (const [physical, logical] of RTL_MAPPINGS) {
      if (!value.startsWith(physical)) {
        continue;
      }
      // Bare patterns (no trailing dash) must match exactly so border-ring
      // doesn't match border-r.
      if (!physical.endsWith("-") && value !== physical) {
        continue;
      }
      violations.push({ line, raw, reason: `use ${value.replace(physical, logical)}` });
      break;
    }
  }

  return violations;
}
