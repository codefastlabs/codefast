import { cn } from '@codefast/ui';
import { Geist, Geist_Mono as GeistMono } from 'next/font/google';

export const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

export const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const fontVariables = cn(geistSans.variable, geistMono.variable);
