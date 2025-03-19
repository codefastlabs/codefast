import type { Metadata, Viewport } from 'next';
import type { JSX } from 'react';

import { cn, Toaster } from '@codefast/ui';
import { cookies } from 'next/headers';

import { ActiveThemeProvider } from '@/components/active-theme';
import { ThemeProvider } from '@/components/theme-provider';
import { fontVariables } from '@/lib/fonts';
import { META_THEME_COLORS, siteConfig } from '@/lib/site';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: {
    default: siteConfig.name,
    template: `%s - ${siteConfig.name}`,
  },
  description: siteConfig.description,
  metadataBase: new URL(siteConfig.url),
  keywords: ['Next.js', 'React', 'Tailwind CSS', 'Server Components', 'Radix UI'],
  authors: [
    {
      name: 'codefastlabs',
      url: siteConfig.links.github,
    },
  ],
  creator: 'vuongphan',
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
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.name,
    description: siteConfig.description,
    images: [siteConfig.ogImage],
    creator: '@vuongphan',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon-16x16.png',
    apple: '/apple-touch-icon.png',
  },
  manifest: `${siteConfig.url}/site.webmanifest`,
};

export const viewport: Viewport = {
  themeColor: META_THEME_COLORS.light,
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): Promise<JSX.Element> {
  const cookieStore = await cookies();
  const activeThemeValue = cookieStore.get('active_theme')?.value;

  return (
    <html
      suppressHydrationWarning
      className={cn(fontVariables, 'scroll-smooth antialiased', activeThemeValue && `theme-${activeThemeValue}`)}
      lang="en"
    >
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `try{"dark"!==localStorage.theme&&("theme"in localStorage&&"system"!==localStorage.theme||!window.matchMedia("(prefers-color-scheme: dark)").matches)||document.querySelector('meta[name="theme-color"]').setAttribute("content","${META_THEME_COLORS.dark}")}catch(e){}`,
          }}
        />
      </head>
      <body>
        <ThemeProvider disableTransitionOnChange enableColorScheme enableSystem attribute="class" defaultTheme="system">
          <ActiveThemeProvider initialTheme={activeThemeValue}>{children}</ActiveThemeProvider>
          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
