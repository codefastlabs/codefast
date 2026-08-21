/**
 * Tiered console helpers shared by the runnable examples.
 *
 * @remarks
 * The layers, from outermost to innermost: `banner` for an example's bootstrap
 * heading, `section` for a phase within it, `step` for an action under a phase,
 * then the leaf lines — `item`, `ok`, `fail`, and `caughtError`.
 */

// ── Console: tiered output ───────────────────────────────────────────────────────────────────────────────────────────

const RULE_WIDTH = 60;

/** Renders `value` as a single line, JSON-encoding objects. */
function format(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "object" && value !== null) {
    try {
      return JSON.stringify(value);
    } catch {
      // Circular graphs and BigInt fields make JSON.stringify throw; fall back to a safe tag.
      return Object.prototype.toString.call(value);
    }
  }

  return String(value);
}

/** Prints a boxed heading for an example's top-level bootstrap phase. */
export function banner(title: string): void {
  const rule = "═".repeat(RULE_WIDTH);
  console.log(`\n${rule}\n  ${title}\n${rule}`);
}

/** Prints a blank line then a top-level section heading. */
export function section(title: string): void {
  console.log(`\n▸ ${title}`);
}

/** Prints an indented action line under the current section. */
export function step(message: string): void {
  console.log(`  · ${message}`);
}

/** Prints an indented label and its value. */
export function item(label: string, value: unknown): void {
  console.log(`  ${label}: ${format(value)}`);
}

/** Prints an indented success marker. */
export function ok(message: string): void {
  console.log(`  ✓ ${message}`);
}

/** Prints an indented failure marker. */
export function fail(message: string): void {
  console.log(`  ✗ ${message}`);
}

/** Prints an indented marker for an expected error, surfacing its `code` and message. */
export function caughtError(label: string, error: unknown): void {
  if (!(error instanceof Error)) {
    console.log(`  ✗ ${label}: non-error thrown (${format(error)})`);

    return;
  }

  const code = "code" in error ? ` [${String(error.code)}]` : "";
  console.log(`  ✓ ${label}${code}: ${error.message}`);
}
