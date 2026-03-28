import { useTheme } from "@codefast/theme";
import { cn } from "@codefast/tailwind-variants";
import { codeToHtml } from "shiki";
import { useEffect, useState } from "react";

/** Match apps/docs markdown pipeline (see src/utils/markdown.ts). */
const SHIKI_THEME_LIGHT = "github-light";
const SHIKI_THEME_DARK = "tokyo-night";

export type ShikiCodeLang = "tsx" | "typescript" | "bash";

type ShikiThemeCodeBlockProps = {
  code: string;
  lang?: ShikiCodeLang;
  className?: string;
};

/**
 * Client-side Shiki highlighting; theme follows {@link useTheme} resolved appearance.
 */
export function ShikiThemeCodeBlock({ code, lang = "tsx", className }: ShikiThemeCodeBlockProps) {
  const { resolvedTheme } = useTheme();
  const [html, setHtml] = useState<string>("");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        const theme = resolvedTheme === "dark" ? SHIKI_THEME_DARK : SHIKI_THEME_LIGHT;
        const out = await codeToHtml(code, {
          lang,
          theme,
          /** Let the panel use `bg-background`; avoid theme `pre` bg (e.g. tokyo-night navy vs section charcoal). */
          rootStyle: false,
        });
        if (!cancelled) {
          setHtml(out);
          setFailed(false);
        }
      } catch {
        if (!cancelled) {
          setFailed(true);
        }
      }
    };
    void run();

    return () => {
      cancelled = true;
    };
  }, [code, lang, resolvedTheme]);

  if (failed) {
    return (
      <pre
        className={cn(
          "min-w-0 flex-1 overflow-x-auto rounded-lg p-3 font-mono text-[0.7rem] leading-relaxed text-foreground sm:text-xs",
          className,
        )}
      >
        <code>{code}</code>
      </pre>
    );
  }

  if (!html) {
    return (
      <pre
        className={cn(
          "min-w-0 flex-1 animate-pulse overflow-x-auto rounded-lg bg-muted/30 p-3 font-mono text-[0.7rem] text-muted-foreground sm:text-xs",
          className,
        )}
      >
        <code> </code>
      </pre>
    );
  }

  return (
    <div
      className={cn(
        "min-w-0 flex-1 overflow-x-auto text-left [&_code]:bg-transparent [&_code]:font-mono [&_code]:text-[0.7rem] sm:[&_code]:text-xs [&_pre]:m-0 [&_pre]:max-h-[min(24rem,55vh)] [&_pre]:overflow-x-auto [&_pre]:rounded-lg [&_pre]:bg-transparent [&_pre]:p-3",
        className,
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
