import type { RtlClassToken } from "#/audit/domain/types";

/**
 * Split a class token into [variant, value, modifier], colon/slash-aware of
 * brackets and parens (arbitrary values like data-[side=left] or calc(...)).
 */
export function splitClassName(token: string): [string | null, string, string | null] {
  const segments: Array<string> = [];
  let current = "";
  let depth = 0;
  for (const char of token) {
    if (char === "[" || char === "(") {
      depth++;
    } else if (char === "]" || char === ")") {
      depth--;
    }
    if (char === ":" && depth === 0) {
      segments.push(current);
      current = "";
    } else {
      current += char;
    }
  }
  segments.push(current);
  let value = segments.pop() ?? "";
  const variant = segments.length > 0 ? segments.join(":") : null;
  let modifier: string | null = null;
  depth = 0;
  let slashIndex = -1;
  for (let index = 0; index < value.length; index++) {
    const char = value[index];
    if (char === "[" || char === "(") {
      depth++;
    } else if (char === "]" || char === ")") {
      depth--;
    } else if (char === "/" && depth === 0) {
      slashIndex = index;
    }
  }
  if (slashIndex !== -1) {
    modifier = value.slice(slashIndex + 1);
    value = value.slice(0, slashIndex);
  }
  return [variant, value, modifier];
}

/** Extract string/template literal contents with their line numbers. */
export function* stringLiterals(content: string): Generator<{ text: string; line: number }> {
  const pattern = /"([^"\n]*)"|'([^'\n]*)'|`([^`]*)`/g;
  for (const match of content.matchAll(pattern)) {
    const text = match[1] ?? match[2] ?? match[3] ?? "";
    const line = content.slice(0, match.index).split("\n").length;
    yield { text, line };
  }
}

export function collectTokens(content: string): Array<RtlClassToken> {
  const tokens: Array<RtlClassToken> = [];
  for (const { text, line } of stringLiterals(content)) {
    for (const raw of text.split(/\s+/)) {
      if (!raw || raw.includes("${")) {
        continue;
      }
      const token = raw.endsWith("!") ? raw.slice(0, -1) : raw;
      const [variant, value, modifier] = splitClassName(token);
      if (!value) {
        continue;
      }
      tokens.push({ raw, token, variant, value, modifier, line });
    }
  }
  return tokens;
}
