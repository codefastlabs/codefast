/**
 * Raw source resolver for detail-page doc examples.
 *
 * Every `docs/<slug>/<example>.tsx` and `docs/<slug>/anatomy.txt` is exposed as a
 * source string via a single `import.meta.glob`, replacing the hand-maintained
 * `?raw` barrel that used to list each file by name. A `.doc.ts` resolves its own
 * sources by `(slug, name)` — there is nothing to register.
 *
 * Vite resolves `?raw` to the file's text; oxlint's `import/default` rule never
 * fires here because the import is dynamic (glob), not a static default re-export.
 */
const sources = import.meta.glob<string>("./*/*.{tsx,txt}", {
  eager: true,
  import: "default",
  query: "?raw",
});

function read(path: string): string {
  return sources[path] ?? "";
}

/** Source of `docs/<slug>/<name>.tsx`. */
export function docSource(slug: string, name: string): string {
  return read(`./${slug}/${name}.tsx`);
}

/** Source of the `docs/<slug>/anatomy.txt` composition skeleton. */
export function docAnatomy(slug: string): string {
  return read(`./${slug}/anatomy.txt`);
}
