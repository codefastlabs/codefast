import type { Metadata, Viewport } from 'next';
import type { JSX } from 'react';

import { cn, Toaster } from '@codefast/ui';

import { ThemeProvider } from '@/components/theme-provider';
import { siteConfig } from '@/config/site';
import { geistMono, geistSans } from '@/lib/fonts';
import '@/app/globals.css';

const META_THEME_COLORS = {
  light: '#ffffff',
  dark: '#09090b',
};

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>): JSX.Element {
  return (
    <html
      suppressHydrationWarning
      className={cn(geistSans.variable, geistMono.variable, 'dark:scheme-dark scroll-smooth antialiased')}
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
        <ThemeProvider disableTransitionOnChange enableSystem attribute="class" defaultTheme="system">
          {children}

          <Toaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
