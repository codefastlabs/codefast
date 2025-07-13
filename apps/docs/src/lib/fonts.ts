import {
  Geist,
  Geist_Mono as GeistMono,
  Instrument_Sans as InstrumentSans,
  Inter,
  JetBrains_Mono as JetBrainsMono,
  Mulish,
  Noto_Sans_Mono as NotoSansMono,
} from "next/font/google";

import { cn } from "@codefast/ui";

const fontGeistSans = Geist({
  subsets: ["latin-ext"],
  variable: "--font-geist-sans",
});

const fontGeistMono = GeistMono({
  subsets: ["latin-ext"],
  variable: "--font-geist-mono",
});

const fontInstrument = InstrumentSans({
  subsets: ["latin-ext"],
  variable: "--font-instrument",
});

const fontNotoMono = NotoSansMono({
  subsets: ["vietnamese"],
  variable: "--font-noto-mono",
});

const fontMullish = Mulish({
  subsets: ["vietnamese"],
  variable: "--font-mullish",
});

const fontInter = Inter({
  subsets: ["vietnamese"],
  variable: "--font-inter",
});

const fontJetBrainsMono = JetBrainsMono({
  subsets: ["vietnamese"],
  variable: "--font-jetbrains-mono",
});

export const fontVariables = cn(
  fontGeistSans.variable,
  fontGeistMono.variable,
  fontInstrument.variable,
  fontNotoMono.variable,
  fontMullish.variable,
  fontInter.variable,
  fontJetBrainsMono.variable,
);
