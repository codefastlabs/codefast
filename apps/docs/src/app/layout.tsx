import "@/app/globals.css";

import type { Metadata, Viewport } from "next";
import { cookies } from "next/headers";
import Script from "next/script";
import type { JSX, ReactNode } from "react";

import { ActiveThemeProvider } from "@/components/active-theme";
import { ThemeProvider } from "@/components/theme-provider";
import { fontVariables } from "@/lib/fonts";
import { META_THEME_COLORS, siteConfig } from "@/lib/site";
import { cn, Toaster } from "@codefast/ui";

export const metadata: Metadata = {
  description: siteConfig.description,
  icons: {
    apple: "/apple-touch-icon.png",
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
  },
  keywords: ["Next.js", "React", "Tailwind CSS", "Server Components", "Radix UI"],
  manifest: `${siteConfig.url}/site.webmanifest`,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    description: siteConfig.description,
    images: [
      {
        alt: siteConfig.name,
        height: 630,
        url: siteConfig.ogImage,
        width: 1200,
      },
    ],
    locale: "en_US",
    siteName: siteConfig.name,
    title: siteConfig.name,
    type: "website",
    url: siteConfig.url,
  },
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: ReactNode;
}>): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get("active_theme")?.value;
  const isScaled = activeThemeValue?.endsWith("-scaled");

  return (
    <html
      suppressHydrationWarning
      className={cn(
        "antialiased",
        activeThemeValue && `theme-${activeThemeValue}`,
        isScaled && "theme-scaled",
        fontVariables,
      )}
      lang="en"
    >
      <body>
        <ThemeProvider
          disableTransitionOnChange
          enableColorScheme
          enableSystem
          attribute="class"
          defaultTheme="system"
        >
          <ActiveThemeProvider initialTheme={activeThemeValue}>{children}</ActiveThemeProvider>
          <Toaster />
        </ThemeProvider>
        <Script
          dangerouslySetInnerHTML={{
            __html: `try{"dark"!==localStorage.theme&&("theme"in localStorage&&"system"!==localStorage.theme||!window.matchMedia("(prefers-color-scheme: dark)").matches)||document.querySelector('meta[name="theme-color"]').setAttribute("content","${META_THEME_COLORS.dark}")}catch(e){}`,
          }}
          id="theme-color-script"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
