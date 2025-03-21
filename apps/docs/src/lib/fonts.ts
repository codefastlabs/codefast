import { cn } from '@codefast/ui';
import {
  Geist,
  Geist_Mono as GeistMono,
  Instrument_Sans as InstrumentSans,
  Inter,
  Mulish,
  Noto_Sans_Mono as NotoSansMono,
} from 'next/font/google';

const fontGeistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const fontGeistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const fontInstrument = InstrumentSans({
  variable: '--font-instrument',
  subsets: ['latin'],
});

const fontNotoMono = NotoSansMono({
  variable: '--font-noto-mono',
  subsets: ['latin'],
});

const fontMullish = Mulish({
  variable: '--font-mullish',
  subsets: ['latin'],
});

const fontInter = Inter({
  variable: '--font-inter',
  subsets: ['latin'],
});

export const fontVariables = cn(
  fontGeistSans.variable,
  fontGeistMono.variable,
  fontInstrument.variable,
  fontNotoMono.variable,
  fontMullish.variable,
  fontInter.variable,
);
