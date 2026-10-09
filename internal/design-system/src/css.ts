/** A custom property as a stylesheet declares it, with the trailing comment that annotates it. */
export interface CssDeclaration {
  comment: string | undefined;
  name: string;
  value: string;
}

/**
 * Reads the single-line custom properties declared directly inside the first block whose selector is `selector`.
 *
 * @remarks
 * Nested at-rules inside the block are skipped; the block ends at its matching brace.
 */
export function readBlock(css: string, selector: string): Array<CssDeclaration> {
  const start = css.indexOf(`${selector} {`);
  if (start === -1) {
    throw new Error(`No "${selector}" block`);
  }
  let depth = 0;
  let end = start;
  for (let index = css.indexOf("{", start); index < css.length; index++) {
    if (css[index] === "{") {
      depth++;
    } else if (css[index] === "}" && --depth === 0) {
      end = index;
      break;
    }
  }
  return readDeclarations(css.slice(start, end));
}

/** Reads every single-line custom property in `css`, in source order. */
export function readDeclarations(css: string): Array<CssDeclaration> {
  return [...css.matchAll(/^\s*--([\w-]+):\s*([^;\n]+);[ \t]*(?:\/\*\s*(.*?)\s*\*\/)?/gm)].map((match) => ({
    comment: match[3],
    name: match[1] ?? "",
    value: (match[2] ?? "").trim(),
  }));
}

/** Indexes declarations by name; a later declaration wins, as in the cascade. */
export function byName(declarations: Array<CssDeclaration>): Map<string, CssDeclaration> {
  return new Map(declarations.map((declaration) => [declaration.name, declaration]));
}

/** Evaluates a plain arithmetic `calc()` over numbers, or returns a bare number. */
export function evaluateNumber(value: string): number {
  const expression = value.replace(/^calc\((.*)\)$/, "$1").trim();
  if (!/^[\d.\s*/+-]+$/.test(expression)) {
    throw new Error(`Not a numeric expression: ${value}`);
  }
  return expression
    .split(/\s*([*/])\s*/)
    .reduce<{ op: string; total: number }>(
      (state, token) =>
        token === "*" || token === "/"
          ? { ...state, op: token }
          : { op: state.op, total: state.op === "/" ? state.total / Number(token) : state.total * Number(token) },
      { op: "*", total: 1 },
    ).total;
}

/** Rounds to four decimals and drops trailing zeros. */
export function trimNumber(value: number): string {
  return String(Number(value.toFixed(4)));
}
