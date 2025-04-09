import { cn } from "@codefast/ui";
import {
  Geist,
  Geist_Mono as GeistMono,
  Instrument_Sans as InstrumentSans,
  Inter,
  JetBrains_Mono as JetBrainsMono,
  Mulish,
  Noto_Sans_Mono as NotoSansMono,
} from "next/font/google";

const fontGeistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin-ext"],
});

const fontGeistMono = GeistMono({
  variable: "--font-geist-mono",
  subsets: ["latin-ext"],
});

const fontInstrument = InstrumentSans({
  variable: "--font-instrument",
  subsets: ["latin-ext"],
});

const fontNotoMono = NotoSansMono({
  variable: "--font-noto-mono",
  subsets: ["vietnamese"],
});

const fontMullish = Mulish({
  variable: "--font-mullish",
  subsets: ["vietnamese"],
});

const fontInter = Inter({
  variable: "--font-inter",
  subsets: ["vietnamese"],
});

const fontJetBrainsMono = JetBrainsMono({
  variable: "--font-jetbrains-mono",
  subsets: ["vietnamese"],
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
