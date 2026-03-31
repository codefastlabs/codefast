import { ThemeAppearancePage } from "#components/theme-appearance-page";
import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/theme/")({
  component: ThemePage,
  head: () => ({
    meta: [
      { title: "Themes — @codefast/ui" },
      {
        name: "description",
        content:
          "TanStack Start integration for @codefast/theme: root loader, ThemeScript, ThemeProvider, and useTheme(). Plus live appearance controls and semantic token swatches.",
      },
      { property: "og:title", content: "Themes — @codefast/ui" },
      {
        property: "og:description",
        content:
          "TanStack Start integration for @codefast/theme: root loader, ThemeScript, ThemeProvider, and useTheme(). Plus live appearance controls and semantic token swatches.",
      },
      { name: "twitter:title", content: "Themes — @codefast/ui" },
      {
        name: "twitter:description",
        content:
          "TanStack Start integration for @codefast/theme: root loader, ThemeScript, ThemeProvider, and useTheme(). Plus live appearance controls and semantic token swatches.",
      },
    ],
  }),
});

function ThemePage() {
  return <ThemeAppearancePage />;
}
