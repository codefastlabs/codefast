import type { Metadata } from 'next';
import type { JSX, ReactNode } from 'react';

import { inter } from '@/app/fonts';
import { Providers } from '@/components/providers';
import '@/app/globals.css';

export const metadata: Metadata = {
  description: 'Generated by create next app',
  title: 'Create Next App',
};

export default function RootLayout({ children }: Readonly<{ children: ReactNode }>): JSX.Element {
  return (
    <html className={inter.variable} lang="en">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
