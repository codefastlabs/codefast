import type { Metadata, Viewport } from 'next';
import type { JSX, ReactNode } from 'react';

import { cn, Toaster } from '@codefast/ui';
import { cookies } from 'next/headers';
import Script from 'next/script';

import { ActiveThemeProvider } from '@/components/active-theme';
import { ThemeProvider } from '@/components/theme-provider';
import { fontVariables } from '@/lib/fonts';
import { META_THEME_COLORS, siteConfig } from '@/lib/site';
import '@/app/globals.css';

export const metadata: Metadata = {
  description: siteConfig.description,
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  keywords: ['Next.js', 'React', 'Tailwind CSS', 'Server Components', 'Radix UI'],
  manifest: `${siteConfig.url}/site.webmanifest`,
  metadataBase: new URL(siteConfig.url),
  openGraph: {
    type: 'website',
    locale: 'en_US',
    url: siteConfig.url,
    title: siteConfig.name,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: siteConfig.name,
      },
    ],
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
  const activeThemeValue = cookieStore.get('active_theme')?.value;
  const isScaled = activeThemeValue?.endsWith('-scaled');

  return (
    <html
      suppressHydrationWarning
      className={cn(
        'overscroll-none antialiased',
        activeThemeValue && `theme-${activeThemeValue}`,
        isScaled && 'theme-scaled',
        fontVariables,
      )}
      lang="en"
    >
      <body>
        <ThemeProvider disableTransitionOnChange enableColorScheme enableSystem attribute="class" defaultTheme="system">
          <ActiveThemeProvider initialTheme={activeThemeValue}>{children}</ActiveThemeProvider>
          <Toaster />
        </ThemeProvider>
        <Script
          dangerouslySetInnerHTML={{
            __html: `try{"dark"!==localStorage.theme&&("theme"in localStorage&&"system"!==localStorage.theme||!window.matchMedia("(prefers-color-scheme: dark)").matches)||document.querySelector('meta[name="theme-color"]').setAttribute("content","${META_THEME_COLORS.dark}")}catch(e){}`,
          }}
          id="theme-script"
          strategy="afterInteractive"
        />
      </body>
    </html>
  );
}
